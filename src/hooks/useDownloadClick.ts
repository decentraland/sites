import { useCallback } from 'react'
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
 */
function useDownloadClick() {
  const { isInitialized } = useAnalytics()
  const deferredTrack = useDeferredTrack()

  return useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const calledAt = Date.now()
      const payload: Record<string, unknown> = readDataAttributes(event.currentTarget)

      if (payload.event === SegmentEvent.CLICK) {
        delete payload.event
      }

      if (isInitialized) {
        deferredTrack(SegmentEvent.CLICK, payload)
        return
      }

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
    [deferredTrack, isInitialized]
  )
}

export { useDownloadClick }
