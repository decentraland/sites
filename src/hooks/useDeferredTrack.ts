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
 * **Observability fields added to every payload:**
 * - `track_called_at`: ms timestamp captured when the consumer invoked the
 *   returned function (i.e. the moment of intent).
 * - `track_delivered_at`: ms timestamp captured right before Segment's
 *   `track()` actually runs (i.e. either the same tick as the call, or
 *   later when the queue drains).
 * - `track_deferred`: boolean — true if Segment was not yet initialized at
 *   call time and the event had to be queued. Lets the data team filter
 *   `WHERE track_deferred = true` to inspect queued fires separately.
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
    const calledAt = Date.now()
    const wasInitialized = isInitializedRef.current
    const fire = () => {
      trackRef.current(event, {
        ...payload,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        track_called_at: calledAt,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        track_delivered_at: Date.now(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        track_deferred: !wasInitialized
      })
    }
    if (wasInitialized) {
      fire()
      return
    }
    queueRef.current.push(fire)
  }, [])
}

export { useDeferredTrack }
