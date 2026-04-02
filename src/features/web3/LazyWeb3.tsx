import { type ComponentType, type PropsWithChildren, useEffect, useState } from 'react'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'
import { staticReducers, store } from '../../app/store'

/** Read wagmi persisted address from localStorage (same key WalletStateProvider uses). */
function getCachedAddress(): string | null {
  try {
    const raw = localStorage.getItem('wagmi.store')
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      state?: { connections?: { value?: Array<[string, { accounts?: string[] }]> }; current?: string }
    }
    const connections = parsed?.state?.connections?.value
    const current = parsed?.state?.current
    if (!current || !connections?.length) return null
    const active = connections.find(([id]) => id === current)
    return active?.[1]?.accounts?.[0] ?? null
  } catch {
    return null
  }
}

/**
 * The auth dapp (decentraland-connect) stores the active provider type in
 * localStorage. If it says "injected" (MetaMask) but wagmi has a
 * "disconnected" flag for the injected connector, wagmi will refuse to
 * reconnect. We reconcile by removing stale disconnected flags when
 * decentraland-connect reports an active session that wagmi doesn't know about.
 */
/**
 * Find a valid (non-expired) identity in localStorage by scanning for
 * single-sign-on-0x... keys. Returns true if at least one exists.
 */
function hasValidIdentity(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('single-sign-on-0x')) {
        const address = key.replace('single-sign-on-', '')
        const identity = localStorageGetIdentity(address)
        if (identity) return true
      }
    }
  } catch {
    // localStorage or identity parsing unavailable
  }
  return false
}

/**
 * Reconcile decentraland-connect sessions with wagmi's disconnected flags.
 *
 * The auth dapp uses decentraland-connect to persist the active provider,
 * while the landing uses wagmi. When the user logs out, wagmi sets
 * `.disconnected` flags that block reconnection. If the user then goes
 * to auth and logs in again, decentraland-connect has a session but wagmi
 * refuses to reconnect.
 *
 * We only clear the flags if:
 * 1. decentraland-connect has an active provider
 * 2. There's a valid (non-expired) identity in single-sign-on storage
 * 3. wagmi has no active connection
 */
function reconcileDisconnectedFlags(): void {
  try {
    const raw = localStorage.getItem('decentraland-connect-storage-key')
    if (!raw) return

    const data = JSON.parse(raw) as { providerType?: string }
    if (!data.providerType) return

    if (!hasValidIdentity()) return

    const wagmiStore = localStorage.getItem('wagmi.store')
    const hasWagmiConnection = wagmiStore && wagmiStore.includes('"current"') && !wagmiStore.includes('"current":null')

    if (!hasWagmiConnection) {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('.disconnected')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
  } catch {
    // Silently fail — worst case wagmi just doesn't reconnect
  }
}

/**
 * Lazy-loads the Web3 providers and pre-seeds Redux with the cached wallet
 * address so Web3Sync doesn't flash a transient disconnected state.
 */
function LazyWeb3({ children }: PropsWithChildren) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const [Wrapper, setWrapper] = useState<ComponentType<PropsWithChildren> | null>(null)

  useEffect(() => {
    // Reconcile before wagmi initializes — if auth left an active session
    // but wagmi has stale disconnected flags, clear them.
    reconcileDisconnectedFlags()

    Promise.all([import('@dcl/core-web3/lazy'), import('./web3.config'), import('@dcl/core-web3')]).then(([lazy, config, core]) => {
      const injectReducers = lazy.createLazyStoreEnhancer(store, staticReducers)
      injectReducers()

      const address = getCachedAddress()
      if (address) {
        store.dispatch(core.walletActions.setAccount(address))
      }

      const provider = lazy.Web3LazyProvider
      const web3Config = config.web3Config
      setWrapper(() => ({ children: c }: PropsWithChildren) => {
        const LazyProvider = provider
        return <LazyProvider config={web3Config}>{c}</LazyProvider>
      })
    })
  }, [])

  if (!Wrapper) return <>{children}</>
  return <Wrapper>{children}</Wrapper>
}

export { LazyWeb3 }
