import { useCallback, useRef } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { SegmentEvent } from '../modules/segment'
import { ensureSegmentAnonymousId } from '../modules/segmentAnonymousId'
import { postSegmentEvent } from '../modules/segmentBeacon'
import { readDataAttributes } from './adapters/readDataAttributes'
import { useDeferredTrack } from './useDeferredTrack'

/**
 * Click adapter for download CTAs that navigate away immediately after the
 * handler runs. Warm clicks keep analytics-next context; cold clicks bypass the
 * component-scoped queue because navigation would tear it down.
 *
 * `isInitialized` is read through a ref (same pattern as `useDeferredTrack`) so
 * the handler sees Segment's current readiness even if it booted since the last
 * render — closing the sub-render window where a stale `false` would beacon a
 * click that could have gone through analytics-next with full context.
 */
function useDownloadClick() {
  const { isInitialized } = useAnalytics()
  const deferredTrack = useDeferredTrack()
  const isInitializedRef = useRef(isInitialized)
  isInitializedRef.current = isInitialized

  return useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const payload: Record<string, unknown> = readDataAttributes(event.currentTarget)

      if (payload.event === SegmentEvent.CLICK) {
        delete payload.event
      }

      if (isInitializedRef.current) {
        deferredTrack(SegmentEvent.CLICK, payload)
        return
      }

      const calledAt = Date.now()
      postSegmentEvent(
        SegmentEvent.CLICK,
        {
          ...payload,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          track_called_at: calledAt,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          track_delivered_at: Date.now(),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          track_deferred: true
        },
        ensureSegmentAnonymousId()
      )
    },
    [deferredTrack]
  )
}

export { useDownloadClick }
