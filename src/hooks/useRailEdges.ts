import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'

// Sub-pixel slack when comparing a scroll offset against the scrollport, so a
// rail scrolled to its end doesn't keep claiming there is more to reach.
const EDGE_TOLERANCE_PX = 2

interface RailEdgesOptions {
  // Run alongside every edge measurement (mount, scroll, resize, item count
  // change). Lets a caller that tracks more than the edges — paging, a snapped
  // index — reuse this observer instead of putting a second one on the same box.
  onMeasure?: () => void
}

interface RailEdges<T extends HTMLElement> {
  // Attach to the scrollport. A callback ref rather than a plain one because a
  // rail that only mounts once its query resolves would miss an effect: by the
  // time the node exists the effect's dependencies have already settled, and it
  // never runs again. Measuring when the node arrives is the only timing that
  // holds for both a cold load and a re-mount.
  attachRail: (node: T | null) => void
  // The scrollport itself, for callers that also drive it (arrows, dots, drag).
  railRef: MutableRefObject<T | null>
  canScrollLeft: boolean
  canScrollRight: boolean
}

/**
 * Whether a horizontally overflowing rail has content left to reach on either
 * side. Both /places and /events hide the native scrollbar, so this is what
 * decides whether their arrows are shown at all.
 *
 * `contentKey` re-measures when the number of items changes: a rail that grows
 * from three cards to four grows its `scrollWidth` while its own box stays the
 * same size, which a ResizeObserver alone never reports.
 */
function useRailEdges<T extends HTMLElement>(contentKey: unknown, options: RailEdgesOptions = {}): RailEdges<T> {
  const railRef = useRef<T | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Held in a ref so a caller passing an inline closure doesn't re-attach the
  // observer and the scroll listener on every render.
  const onMeasureRef = useRef(options.onMeasure)
  onMeasureRef.current = options.onMeasure

  const measure = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const { clientWidth, scrollLeft, scrollWidth } = el
    setCanScrollLeft(scrollLeft > EDGE_TOLERANCE_PX)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - EDGE_TOLERANCE_PX)
    onMeasureRef.current?.()
  }, [])

  const attachRail = useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect()
      railRef.current?.removeEventListener('scroll', measure)
      railRef.current = node
      if (!node) {
        observerRef.current = null
        return
      }
      node.addEventListener('scroll', measure, { passive: true })
      measure()
      const observer = new ResizeObserver(measure)
      observer.observe(node)
      observerRef.current = observer
    },
    [measure]
  )

  useEffect(() => {
    measure()
  }, [contentKey, measure])

  return { attachRail, railRef, canScrollLeft, canScrollRight }
}

export { useRailEdges }
export type { RailEdges, RailEdgesOptions }
