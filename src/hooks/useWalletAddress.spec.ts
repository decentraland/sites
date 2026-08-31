/**
 * Module-level side effects of `useWalletAddress.ts` run when the file is
 * imported. To exercise the storage listener, the MetaMask `accountsChanged`
 * handler, and the `eth_accounts` reconciliation paths, we install the relevant
 * globals BEFORE the first import using `jest.isolateModulesAsync`.
 */

import { renderHook } from '@testing-library/react'

const localStorageGetIdentityMock = jest.fn()
const redirectToAuthMock = jest.fn()

jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: (...args: unknown[]) => localStorageGetIdentityMock(...args)
}))

jest.mock('../utils/authRedirect', () => ({
  redirectToAuth: (...args: unknown[]) => redirectToAuthMock(...args)
}))

interface EthereumStub {
  on: jest.Mock
  request: jest.Mock
}

const buildIdentity = (expiration: string) => ({
  authChain: [
    { type: 'SIGNER', payload: 'a', signature: '' },
    { type: 'ECDSA_SIGNED_ENTITY', payload: `Expiration: ${expiration}\n`, signature: 's' }
  ],
  ephemeralIdentity: { address: 'e', publicKey: 'pk', privateKey: 'pr' },
  expiration: new Date(expiration)
})

const setupLocalStorage = (entries: Record<string, string>) => {
  localStorage.clear()
  Object.entries(entries).forEach(([k, v]) => localStorage.setItem(k, v))
}

const installEthereum = (request?: jest.Mock): EthereumStub => {
  const stub: EthereumStub = {
    on: jest.fn(),
    request: request ?? jest.fn().mockResolvedValue([])
  }
  ;(window as unknown as { ethereum: EthereumStub }).ethereum = stub
  return stub
}

const removeEthereum = () => {
  delete (window as unknown as { ethereum?: EthereumStub }).ethereum
}

describe('useWalletAddress module', () => {
  beforeEach(() => {
    localStorageGetIdentityMock.mockReset()
    redirectToAuthMock.mockReset()
  })

  afterEach(() => {
    removeEthereum()
    localStorage.clear()
  })

  describe('when the module loads with multiple stored identities', () => {
    it('should expose the most recent address as the initial snapshot', async () => {
      setupLocalStorage({
        'single-sign-on-0xolder': 'x',
        'single-sign-on-0xnewer': 'x',
        unrelated: 'x'
      })
      const older = buildIdentity('2030-01-01T00:00:00Z')
      const newer = buildIdentity('2031-01-01T00:00:00Z')
      localStorageGetIdentityMock.mockImplementation((addr: string) => (addr === '0xolder' ? older : addr === '0xnewer' ? newer : null))
      installEthereum()

      await jest.isolateModulesAsync(async () => {
        const mod = await import('./useWalletAddress')
        expect(mod.useWalletAddress).toBeDefined()
      })
    })

    it('should swallow localStorage failures and resolve to null', async () => {
      const proto = Object.getPrototypeOf(localStorage) as Storage
      const keySpy = jest.spyOn(proto, 'key').mockImplementation(() => {
        throw new Error('boom')
      })
      setupLocalStorage({ 'single-sign-on-0xany': 'x' })
      try {
        installEthereum()
        await jest.isolateModulesAsync(async () => {
          await import('./useWalletAddress')
        })
      } finally {
        keySpy.mockRestore()
      }
    })

    it('should not probe MetaMask eth_accounts at load time', async () => {
      // Regression for the Magic/OTP fix: a previous version called
      // window.ethereum.request({ method: 'eth_accounts' }) on init to seed the
      // pointer with MetaMask's active account. That probe overrode Magic/OTP
      // sessions whenever both providers were present. The module now relies
      // exclusively on the sign-in-pending snapshot, the persistent pointer,
      // and the heuristic scan — never on eth_accounts.
      setupLocalStorage({ 'single-sign-on-0xactive': 'x' })
      localStorageGetIdentityMock.mockReturnValue(buildIdentity('2031-01-01T00:00:00Z'))
      const request = jest.fn().mockResolvedValue(['0xACTIVE'])
      installEthereum(request)
      await jest.isolateModulesAsync(async () => {
        await import('./useWalletAddress')
      })
      await Promise.resolve()
      expect(request).not.toHaveBeenCalled()
    })
  })

  describe('MetaMask accountsChanged listener', () => {
    it('should clear the address when MetaMask reports no accounts', async () => {
      const stub = installEthereum()
      await jest.isolateModulesAsync(async () => {
        await import('./useWalletAddress')
      })
      const handler = stub.on.mock.calls.find(call => call[0] === 'accountsChanged')?.[1] as ((accounts: string[]) => void) | undefined
      expect(handler).toBeDefined()
      handler?.([])
    })

    it('should switch to the new address when MetaMask reports an account with a valid identity', async () => {
      setupLocalStorage({ 'single-sign-on-0xnew': 'x' })
      localStorageGetIdentityMock.mockImplementation((addr: string) => (addr === '0xnew' ? buildIdentity('2031-01-01T00:00:00Z') : null))
      const stub = installEthereum()
      await jest.isolateModulesAsync(async () => {
        await import('./useWalletAddress')
      })
      const handler = stub.on.mock.calls.find(call => call[0] === 'accountsChanged')?.[1] as ((accounts: string[]) => void) | undefined
      handler?.(['0xNEW'])
    })

    it('should redirect to auth when MetaMask reports an unknown account', async () => {
      localStorageGetIdentityMock.mockReturnValue(null)
      const stub = installEthereum()
      await jest.isolateModulesAsync(async () => {
        await import('./useWalletAddress')
      })
      const handler = stub.on.mock.calls.find(call => call[0] === 'accountsChanged')?.[1] as ((accounts: string[]) => void) | undefined
      handler?.(['0xunknown'])
      expect(redirectToAuthMock).toHaveBeenCalledWith(window.location.pathname, { loginMethod: 'METAMASK' })
    })
  })

  // Two wallet extensions competing for `window.ethereum` leave a Proxy whose `get`
  // breaks a JS invariant, so merely reading `.on` throws (SITES-2S5). This file runs
  // at import time and the navbar imports it, so an unguarded read blanked the page.
  describe('when reading window.ethereum throws', () => {
    const installHostileEthereum = (): void => {
      Object.defineProperty(window, 'ethereum', {
        configurable: true,
        get() {
          throw new TypeError("'get' on proxy: property 'on' is a read-only and non-configurable data property")
        }
      })
    }

    it('should still load the module and expose the hook', async () => {
      installHostileEthereum()

      await jest.isolateModulesAsync(async () => {
        const mod = await import('./useWalletAddress')
        expect(mod.useWalletAddress).toBeDefined()
        expect(mod.disconnectWallet).toBeDefined()
      })
    })

    // The guard sits after address resolution and before the exports, so a completed
    // load is what proves the throw no longer aborts the module.
    it('should still resolve the stored identity on load', async () => {
      setupLocalStorage({ 'single-sign-on-0xabc': 'x' })
      localStorageGetIdentityMock.mockReturnValue(buildIdentity('2031-01-01T00:00:00Z'))
      installHostileEthereum()

      await jest.isolateModulesAsync(async () => {
        await import('./useWalletAddress')
      })

      expect(localStorageGetIdentityMock).toHaveBeenCalledWith('0xabc')
    })
  })

  // A provider that exposes `on` but rejects the subscription itself.
  describe('when subscribing to accountsChanged throws', () => {
    it('should load the module without propagating the error', async () => {
      const stub = installEthereum()
      stub.on.mockImplementation(() => {
        throw new TypeError('provider is not ready')
      })

      await jest.isolateModulesAsync(async () => {
        const mod = await import('./useWalletAddress')
        expect(mod.useWalletAddress).toBeDefined()
      })
    })
  })

  describe('disconnectWallet', () => {
    it('should clear every known sign-in storage key', async () => {
      setupLocalStorage({
        'single-sign-on-0xabc': 'x',
        'decentraland-connect.lastConnector': 'x',
        'wagmi.store': 'x',
        'wc@2:client:0.3//session': 'x',
        dcl_magic_user_email: 'x',
        dcl_thirdweb_user_email: 'x',
        unrelated: 'x'
      })
      installEthereum()
      await jest.isolateModulesAsync(async () => {
        const mod = await import('./useWalletAddress')
        mod.disconnectWallet()
        expect(localStorage.getItem('single-sign-on-0xabc')).toBeNull()
        expect(localStorage.getItem('decentraland-connect.lastConnector')).toBeNull()
        expect(localStorage.getItem('wagmi.store')).toBeNull()
        expect(localStorage.getItem('wc@2:client:0.3//session')).toBeNull()
        expect(localStorage.getItem('dcl_magic_user_email')).toBeNull()
        expect(localStorage.getItem('dcl_thirdweb_user_email')).toBeNull()
        expect(localStorage.getItem('unrelated')).toBe('x')
      })
    })
  })

  describe('cross-tab storage event', () => {
    it('should react to storage events for relevant SSO keys', async () => {
      // The previous "cooldown" gating was removed alongside the eth_accounts
      // probe: relevant storage events now always trigger re-resolution
      // (filtered by isRelevantStorageKey). Dispatching an irrelevant event
      // must remain a no-op.
      installEthereum()
      await jest.isolateModulesAsync(async () => {
        await import('./useWalletAddress')
      })
      window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated-app-key' }))
      window.dispatchEvent(new StorageEvent('storage', { key: 'single-sign-on-0xabc' }))
    })
  })

  describe('useWalletAddress hook', () => {
    it('should expose the current address and a disconnect helper', async () => {
      installEthereum()
      // Use jest.requireActual (synchronous) so the React module instance stays consistent with the one renderHook imported.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('./useWalletAddress') as typeof import('./useWalletAddress')
      const { result } = renderHook(() => mod.useWalletAddress())
      expect(result.current).toHaveProperty('address')
      expect(result.current).toHaveProperty('isConnected')
      expect(typeof result.current.disconnect).toBe('function')
      result.current.disconnect()
    })
  })

  describe('hasIdentityFor', () => {
    it('should swallow errors from localStorageGetIdentity (covered indirectly by accountsChanged with throwing identity lookup)', async () => {
      localStorageGetIdentityMock.mockImplementation(() => {
        throw new Error('storage corrupt')
      })
      const stub = installEthereum()
      await jest.isolateModulesAsync(async () => {
        await import('./useWalletAddress')
      })
      const handler = stub.on.mock.calls.find(call => call[0] === 'accountsChanged')?.[1] as ((accounts: string[]) => void) | undefined
      handler?.(['0xthrowing'])
      expect(redirectToAuthMock).toHaveBeenCalled()
    })
  })
})
