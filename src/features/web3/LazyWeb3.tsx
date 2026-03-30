import { type ComponentType, type PropsWithChildren, useEffect, useState } from 'react'
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
 * Lazy-loads the Web3 providers and pre-seeds Redux with the cached wallet
 * address so Web3Sync doesn't flash a transient disconnected state.
 */
function LazyWeb3({ children }: PropsWithChildren) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const [Wrapper, setWrapper] = useState<ComponentType<PropsWithChildren> | null>(null)

  useEffect(() => {
    Promise.all([import('@dcl/core-web3/lazy'), import('./web3.config'), import('@dcl/core-web3')]).then(([lazy, config, core]) => {
      // Inject web3 reducers lazily — createLazyStoreEnhancer imports walletReducer/networkReducer
      // which transitively import wagmi, so this MUST be in the lazy chunk.
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
  }, [])

  if (!Wrapper) return <>{children}</>
  return <Wrapper>{children}</Wrapper>
}

export { LazyWeb3 }
