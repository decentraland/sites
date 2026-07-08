import { useCallback, useRef } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { collectCampaignParams } from '../modules/campaignParams'
import { recordDownloadClickCorrelation } from '../modules/downloadClickCorrelation'
import { markDownloadCtaClicked } from '../modules/downloadPageExit'
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
      // Feeds the download_page_exit diagnostic: /download resets this flag on
      // mount and reads it when the page becomes hidden.
      markDownloadCtaClicked()

      // Merge the URL's campaign params so a partner link
      // (`/download?utm_source=…`) attributes every download CTA click, cold
      // loads included — see `collectCampaignParams`. data-* attributes are
      // spread last as the trusted, component-controlled source. They don't
      // collide with the snake_case utm_* keys because `readDataAttributes`
      // camelCases dashed names — note an underscore attribute name (e.g.
      // `data-utm_source`) WOULD bypass that and clobber the URL value, so
      // never use underscores in data-* names on download CTAs.
      const { downloadTarget, ...dataAttributes } = readDataAttributes(event.currentTarget)
      // Deterministic click → download_* correlation: the same click_id we
      // send here travels via sessionStorage to /download_success (see
      // downloadClickCorrelation.ts). clicked_at enables ms_since_click downstream.
      const correlation = recordDownloadClickCorrelation()
      const payload: Record<string, unknown> = {
        ...collectCampaignParams(),
        ...correlation,
        ...dataAttributes
      }

      if (payload.event === SegmentEvent.CLICK) {
        delete payload.event
      }

      // `readDataAttributes` camelCases dashed attributes (`data-download-target`
      // → `downloadTarget`), but the warehouse dimension is snake_case
      // (`download_target`, alongside utm_* / anon_user_id / auth_state). Rename
      // it so store/installer CTAs stay declarative while the payload keeps the
      // canonical key the data team splits desktop-vs-mobile on.
      if (downloadTarget) {
        payload.download_target = downloadTarget
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
