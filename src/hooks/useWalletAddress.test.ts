/* eslint-disable @typescript-eslint/naming-convention */
// eslint-disable-next-line import/exports-last
export {} // make this file a module so declare global works

declare global {
  interface Window {
    ethereum?: {
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on?: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
    }
  }
}

// ── Mocks ────────────────────────────────────────────────────────────

const mockLocalStorageGetIdentity = jest.fn()
jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: (...args: unknown[]) => mockLocalStorageGetIdentity(...args)
}))

const mockRedirectToAuth = jest.fn()
jest.mock('../utils/authRedirect', () => ({
  redirectToAuth: (...args: unknown[]) => mockRedirectToAuth(...args)
}))

let mockEthereumAccounts: string[] = []
let accountsChangedHandler: ((...args: unknown[]) => void) | null = null
let storageHandler: ((event: StorageEvent) => void) | null = null

const mockEthereum = {
  request: jest.fn(async ({ method }: { method: string }) => {
    if (method === 'eth_accounts') return mockEthereumAccounts
    return null
  }),
  on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
    if (event === 'accountsChanged') accountsChangedHandler = handler
  }),
  removeListener: jest.fn()
}

Object.defineProperty(globalThis, 'window', {
  value: {
    ...globalThis.window,
    ethereum: mockEthereum,
    addEventListener: jest.fn((event: string, handler: (e: StorageEvent) => void) => {
      if (event === 'storage') storageHandler = handler
    }),
    removeEventListener: jest.fn(),
    location: { pathname: '/' }
  },
  writable: true
})

// Mock localStorage
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value
  },
  removeItem: (key: string) => {
    delete store[key]
  },
  clear: () => {
    Object.keys(store).forEach(k => delete store[k])
  },
  get length() {
    return Object.keys(store).length
  },
  key: (i: number) => Object.keys(store)[i] ?? null
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// ── Helpers ──────────────────────────────────────────────────────────

const ACTIVE_ADDRESS_KEY = 'dcl:active-address'

function fakeIdentity(address: string, expirationDate: string) {
  return {
    authChain: [
      { type: 'SIGNER', payload: address },
      { type: 'ECDSA_EPHEMERAL', payload: `Decentraland Login\nEphemeral address: 0xabc\nExpiration: ${expirationDate}` },
      { type: 'ECDSA_SIGNED_ENTITY', payload: 'sig', signature: 'sig' }
    ]
  }
}

function setStoredIdentities(identities: Record<string, string>) {
  localStorageMock.clear()
  for (const [address, expiration] of Object.entries(identities)) {
    localStorageMock.setItem(`single-sign-on-${address}`, JSON.stringify(fakeIdentity(address, expiration)))
  }
  mockLocalStorageGetIdentity.mockImplementation((addr: string) => {
    const raw = localStorageMock.getItem(`single-sign-on-${addr}`)
    return raw ? JSON.parse(raw) : null
  })
}

function makeStorageEvent(key: string | null): StorageEvent {
  return { key } as StorageEvent
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('useWalletAddress', () => {
  beforeEach(() => {
    jest.resetModules()
    localStorageMock.clear()
    mockLocalStorageGetIdentity.mockReset()
    mockRedirectToAuth.mockReset()
    mockEthereum.request.mockClear()
    mockEthereum.on.mockClear()
    mockEthereumAccounts = []
    accountsChangedHandler = null
    storageHandler = null
  })

  describe('when no identities exist', () => {
    it('should initialize without crashing', async () => {
      setStoredIdentities({})
      await expect(import('./useWalletAddress')).resolves.toBeDefined()
    })

    it('should not write the active-address pointer', async () => {
      setStoredIdentities({})
      await import('./useWalletAddress')
      expect(localStorageMock.getItem(ACTIVE_ADDRESS_KEY)).toBeNull()
    })
  })

  describe('when exactly one identity exists', () => {
    it('should auto-promote it to the active-address pointer on init', async () => {
      setStoredIdentities({ '0xonly': '2030-01-01T00:00:00Z' })
      await import('./useWalletAddress')
      expect(localStorageMock.getItem(ACTIVE_ADDRESS_KEY)).toBe('0xonly')
    })
  })

  describe('when multiple identities exist', () => {
    it('should NOT write the pointer when no pointer is set (ambiguous state)', async () => {
      setStoredIdentities({
        '0xolder': '2025-01-01T00:00:00Z',
        '0xnewer': '2030-06-15T00:00:00Z'
      })
      mockEthereumAccounts = []
      await import('./useWalletAddress')
      expect(localStorageMock.getItem(ACTIVE_ADDRESS_KEY)).toBeNull()
    })

    it('should honor an existing pointer instead of the max-expiration heuristic', async () => {
      setStoredIdentities({
        '0xolder': '2026-06-03T13:56:58.962Z',
        '0xnewer': '2026-06-07T22:40:52.233Z'
      })
      localStorageMock.setItem(ACTIVE_ADDRESS_KEY, '0xolder')
      mockEthereumAccounts = []
      await import('./useWalletAddress')
      expect(localStorageMock.getItem(ACTIVE_ADDRESS_KEY)).toBe('0xolder')
    })
  })

  describe('MetaMask account switch (accountsChanged)', () => {
    it('should switch to the new account and persist it as the pointer', async () => {
      setStoredIdentities({
        '0xfirst': '2030-01-01T00:00:00Z',
        '0xsecond': '2029-01-01T00:00:00Z'
      })
      mockEthereumAccounts = ['0xfirst']
      await import('./useWalletAddress')

      accountsChangedHandler?.(['0xsecond'])

      expect(localStorageMock.getItem(ACTIVE_ADDRESS_KEY)).toBe('0xsecond')
      expect(mockRedirectToAuth).not.toHaveBeenCalled()
    })

    it('should redirect to auth if the new account has no identity', async () => {
      setStoredIdentities({ '0xfirst': '2030-01-01T00:00:00Z' })
      mockEthereumAccounts = ['0xfirst']
      await import('./useWalletAddress')

      accountsChangedHandler?.(['0xunknown'])

      expect(mockRedirectToAuth).toHaveBeenCalledWith('/', { loginMethod: 'METAMASK' })
    })

    it('should keep the pointer when the wallet is locked (empty accounts)', async () => {
      setStoredIdentities({ '0xfirst': '2030-01-01T00:00:00Z' })
      mockEthereumAccounts = ['0xfirst']
      await import('./useWalletAddress')

      // Single identity → pointer was auto-promoted on init.
      expect(localStorageMock.getItem(ACTIVE_ADDRESS_KEY)).toBe('0xfirst')

      accountsChangedHandler?.([])

      // Pointer survives locking so the user returns to the same wallet on unlock.
      expect(localStorageMock.getItem(ACTIVE_ADDRESS_KEY)).toBe('0xfirst')
      expect(mockRedirectToAuth).not.toHaveBeenCalled()
    })

    it('should handle non-array args gracefully', async () => {
      setStoredIdentities({ '0xfirst': '2030-01-01T00:00:00Z' })
      mockEthereumAccounts = ['0xfirst']
      await import('./useWalletAddress')

      accountsChangedHandler?.(null)
      accountsChangedHandler?.(undefined)
      accountsChangedHandler?.('not-an-array')

      expect(mockRedirectToAuth).not.toHaveBeenCalled()
    })
  })

  describe('eth_accounts reconciliation on load', () => {
    it('should seed the pointer when it is missing', async () => {
      setStoredIdentities({
        '0xstored': '2030-01-01T00:00:00Z',
        '0xactive': '2029-01-01T00:00:00Z'
      })
      mockEthereumAccounts = ['0xactive']
      await import('./useWalletAddress')
      await new Promise(r => setTimeout(r, 50))

      expect(localStorageMock.getItem(ACTIVE_ADDRESS_KEY)).toBe('0xactive')
    })

    it('should NOT override an existing pointer', async () => {
      setStoredIdentities({
        '0xmagic': '2030-01-01T00:00:00Z',
        '0xmetamask': '2029-01-01T00:00:00Z'
      })
      localStorageMock.setItem(ACTIVE_ADDRESS_KEY, '0xmagic')
      mockEthereumAccounts = ['0xmetamask']
      await import('./useWalletAddress')
      await new Promise(r => setTimeout(r, 50))

      expect(localStorageMock.getItem(ACTIVE_ADDRESS_KEY)).toBe('0xmagic')
    })

    it('should ignore the MetaMask account when it has no stored identity', async () => {
      setStoredIdentities({ '0xstored': '2030-01-01T00:00:00Z' })
      mockEthereumAccounts = ['0xunknown']
      await import('./useWalletAddress')
      await new Promise(r => setTimeout(r, 50))

      expect(localStorageMock.getItem(ACTIVE_ADDRESS_KEY)).toBe('0xstored')
    })
  })

  describe('storage event filter', () => {
    it('should register a listener on init', async () => {
      setStoredIdentities({})
      await import('./useWalletAddress')
      expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    })

    it('should ignore events with unrelated keys', async () => {
      setStoredIdentities({ '0xa': '2030-01-01T00:00:00Z' })
      await import('./useWalletAddress')
      const lookupsBefore = mockLocalStorageGetIdentity.mock.calls.length

      storageHandler?.(makeStorageEvent('wagmi.store'))
      storageHandler?.(makeStorageEvent('decentraland-connect'))
      storageHandler?.(makeStorageEvent('unrelated-app-key'))

      expect(mockLocalStorageGetIdentity.mock.calls.length).toBe(lookupsBefore)
    })

    it('should react when the active-address pointer changes', async () => {
      setStoredIdentities({
        '0xa': '2026-06-03T13:56:58.962Z',
        '0xb': '2026-06-07T22:40:52.233Z'
      })
      localStorageMock.setItem(ACTIVE_ADDRESS_KEY, '0xa')
      await import('./useWalletAddress')

      const lookupsBefore = mockLocalStorageGetIdentity.mock.calls.length
      storageHandler?.(makeStorageEvent(ACTIVE_ADDRESS_KEY))
      expect(mockLocalStorageGetIdentity.mock.calls.length).toBeGreaterThan(lookupsBefore)
    })

    it('should react when a single-sign-on-* key changes', async () => {
      setStoredIdentities({ '0xa': '2030-01-01T00:00:00Z' })
      await import('./useWalletAddress')

      const lookupsBefore = mockLocalStorageGetIdentity.mock.calls.length
      storageHandler?.(makeStorageEvent('single-sign-on-0xa'))
      expect(mockLocalStorageGetIdentity.mock.calls.length).toBeGreaterThan(lookupsBefore)
    })
  })

  describe('disconnectWallet', () => {
    it('should clear all auth-related keys, the active-address pointer, and preserve unrelated keys', async () => {
      localStorageMock.setItem('single-sign-on-0xuser', '{}')
      localStorageMock.setItem('decentraland-connect-storage-key', '{}')
      localStorageMock.setItem('wagmi.store', '{}')
      localStorageMock.setItem('wc@2:session', '{}')
      localStorageMock.setItem('dcl_magic_user_email', 'test@test.com')
      localStorageMock.setItem('dcl_thirdweb_user_email', 'otp@test.com')
      localStorageMock.setItem(ACTIVE_ADDRESS_KEY, '0xuser')
      localStorageMock.setItem('unrelated-key', 'keep-me')
      localStorageMock.setItem('another-app-data', 'also-keep')

      const { disconnectWallet } = await import('./useWalletAddress')
      disconnectWallet()

      expect(localStorageMock.getItem('single-sign-on-0xuser')).toBeNull()
      expect(localStorageMock.getItem('decentraland-connect-storage-key')).toBeNull()
      expect(localStorageMock.getItem('wagmi.store')).toBeNull()
      expect(localStorageMock.getItem('wc@2:session')).toBeNull()
      expect(localStorageMock.getItem('dcl_magic_user_email')).toBeNull()
      expect(localStorageMock.getItem('dcl_thirdweb_user_email')).toBeNull()
      expect(localStorageMock.getItem(ACTIVE_ADDRESS_KEY)).toBeNull()

      expect(localStorageMock.getItem('unrelated-key')).toBe('keep-me')
      expect(localStorageMock.getItem('another-app-data')).toBe('also-keep')
    })
  })
})
