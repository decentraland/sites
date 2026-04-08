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
 * Check if there's at least one valid (non-expired) auth identity in
 * localStorage by scanning single-sign-on-0x... keys.
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
 * The auth dapp uses decentraland-connect to persist the active provider type,
 * while consumer dapps use wagmi. When a user disconnects, wagmi sets
 * `.disconnected` flags in localStorage that block auto-reconnection. If the
 * user then goes to the auth dapp and logs in again, decentraland-connect has
 * a valid session but wagmi refuses to reconnect because of the stale flags.
 *
 * This function runs before wagmi initializes and clears the flags only when:
 * 1. decentraland-connect reports an active provider
 * 2. A valid (non-expired) identity exists in single-sign-on storage
 * 3. wagmi has no active connection
 *
 * This is safe because the identity check ensures a real authenticated session
 * exists — we're not blindly reconnecting to stale or expired sessions.
 */
function reconcileDisconnectedFlags(): void {
  try {
    const raw = localStorage.getItem('decentraland-connect-storage-key')
    if (!raw) return

    const data = JSON.parse(raw) as { providerType?: string }
    if (!data.providerType) return

    if (!hasValidIdentity()) return

    let hasWagmiConnection = false
    try {
      const wagmiStore = localStorage.getItem('wagmi.store')
      if (wagmiStore) {
        const parsed = JSON.parse(wagmiStore) as { state?: { current?: string | null } }
        hasWagmiConnection = parsed?.state?.current != null
      }
    } catch {
      // treat as no connection
    }

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

    Promise.all([import('@dcl/core-web3/lazy'), import('./web3.config'), import('@dcl/core-web3')])
      .then(([lazy, config, core]) => {
        const injectReducers = lazy.createLazyStoreEnhancer(store, staticReducers)
        injectReducers()

        // Pre-seed the wallet reducer with the cached address BEFORE wagmi mounts.
        // This prevents a flash in the UI: without this, Web3Sync reads fresh Redux state
        // (address: null) and pushes it to WalletStateContext, overriding the
        // localStorage-derived address for ~30ms until wagmi reconnects.
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
      .catch(() => {
        // Web3 providers failed to load — app continues without wallet support
      })
  }, [])

  if (!Wrapper) return <>{children}</>
  return <Wrapper>{children}</Wrapper>
}

export { LazyWeb3 }
