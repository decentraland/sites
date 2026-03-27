import { type PropsWithChildren, Suspense, lazy } from 'react'

const Web3Inner = lazy(() => import('./Web3Inner').then(m => ({ default: m.Web3Inner })))

function Web3LazyProvider({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={children}>
      <Web3Inner>{children}</Web3Inner>
    </Suspense>
  )
}

export { Web3LazyProvider }
