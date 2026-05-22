import { useCallback, useEffect, useRef } from 'react'
import { useAnalytics } from '@dcl/hooks'
import type { SegmentEvent } from '../modules/segment'

type Track = (event: SegmentEvent, payload: Record<string, unknown>) => void

/**
 * Returns a `track` function that fires immediately when Segment is
 * initialized, or enqueues the call otherwise. The queue drains the next
 * time `isInitialized` flips to `true`.
 *
 * Replaces the previous polling pattern (`waitForAnalytics`, 5s timeout)
 * with an event-driven flush. Payloads should carry their own timestamps
 * (`started_at`, etc.) so that ingestion delay introduced by queueing
 * doesn't distort timing analysis downstream.
 *
 * The queue is component-scoped — on unmount, any still-pending events are
 * dropped along with the ref. That trade-off is intentional: the alternative
 * (a module-level queue) would leak events across page navigations.
 */
function useDeferredTrack(): Track {
  const { isInitialized, track } = useAnalytics()
  const isInitializedRef = useRef(isInitialized)
  const trackRef = useRef(track)
  const queueRef = useRef<Array<() => void>>([])

  isInitializedRef.current = isInitialized
  trackRef.current = track

  useEffect(() => {
    if (!isInitialized) return
    const pending = queueRef.current
    queueRef.current = []
    pending.forEach(fire => fire())
  }, [isInitialized])

  return useCallback((event, payload) => {
    if (isInitializedRef.current) {
      trackRef.current(event, payload)
      return
    }
    queueRef.current.push(() => trackRef.current(event, payload))
  }, [])
}

export { useDeferredTrack }
