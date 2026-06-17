import { useCallback, useState } from 'react'
import type { PropsWithChildren, ReactNode } from 'react'
import { WalletStateProvider, Web3LazyProvider } from '@dcl/core-web3/lazy'
import { injectWeb3Reducers } from './store'
import { getWeb3Config } from './web3Config'

interface BlockchainShellProps {
  /** Rendered while the heavy Web3 bundle loads. Children mount only once wagmi is ready. */
  fallback?: ReactNode
}

/**
 * Third, on-demand shell tier: the lazy Web3 boundary for the account Wallets actions that need a
 * connected signer (Send / Swap). Wraps children in core-web3's `WalletStateProvider` +
 * `Web3LazyProvider` so the heavy Web3 stack (wagmi / viem / magic-sdk) loads ONLY when an action
 * mounts this shell — the rest of sites and the other shells stay Web3-free.
 *
 * Children are gated on readiness: wagmi hooks (`useWallet`, `useWriteContract`, …) throw without a
 * mounted `WagmiProvider`, and `Web3LazyProvider` renders its children during the load window
 * BEFORE that provider exists. We therefore render `fallback` until `onLoad` fires (providers ready
 * + slices injected), then the children — which are now inside the wagmi providers.
 *
 * Must render inside the DappsShell's Redux `<Provider>` (already mounted for any heavy route).
 */
const BlockchainShell = ({ fallback = null, children }: PropsWithChildren<BlockchainShellProps>) => {
  const [isReady, setIsReady] = useState(false)

  const handleLoad = useCallback(() => {
    injectWeb3Reducers()
    setIsReady(true)
  }, [])

  return (
    <WalletStateProvider>
      <Web3LazyProvider config={getWeb3Config()} onLoad={handleLoad}>
        {isReady ? children : fallback}
      </Web3LazyProvider>
    </WalletStateProvider>
  )
}

export { BlockchainShell }
