import { Suspense, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { lazyWithRetry } from '../../../utils/lazyWithRetry'
import { canonicalPathForSelection, selectionKey } from './HomeDetailModal.helpers'
import { HomeDetailModalErrorBoundary } from './HomeDetailModalErrorBoundary'
import { HomeDetailPendingOverlay } from './HomeDetailPendingOverlay'
import type { HomeDetailSelection } from './HomeDetailModal.types'

interface HomeDetailModalLoaderProps {
  selection: HomeDetailSelection | null
  onClose: () => void
}

const createShell = () =>
  lazyWithRetry(() => import('../../../shells/HomeDetailModalShell').then(m => ({ default: m.HomeDetailModalShell })))

// The store and the modal live in a lazy shell that only loads once a card is selected; this file is the
// single lightweight-tier edge allowed to reach it (scripts/check-shell-boundary.mjs).
function HomeDetailModalLoader({ selection, onClose }: HomeDetailModalLoaderProps) {
  const navigate = useNavigate()
  // React caches a rejected dynamic import for the life of the lazy component. Owning it in state lets a
  // failure be followed by a fresh one, so the next card click gets a real second chance.
  const [HomeDetailModalShell, setHomeDetailModalShell] = useState(createShell)

  const handleError = useCallback(
    (error: unknown) => {
      console.error('[HomeDetailModal] could not open the detail in place', error)
      setHomeDetailModalShell(createShell)
      onClose()
      if (selection) navigate(canonicalPathForSelection(selection))
    },
    [selection, onClose, navigate]
  )

  if (!selection) return null

  // Keyed by the selection so the latest card wins and a stale instance can never report a late error.
  return (
    <HomeDetailModalErrorBoundary key={selectionKey(selection)} onError={handleError}>
      <Suspense fallback={<HomeDetailPendingOverlay onClose={onClose} />}>
        <HomeDetailModalShell selection={selection} onClose={onClose} onError={handleError} />
      </Suspense>
    </HomeDetailModalErrorBoundary>
  )
}

export { HomeDetailModalLoader }
export type { HomeDetailModalLoaderProps }
