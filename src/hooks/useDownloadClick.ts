import { useCallback, useRef } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { postDeferredClick } from '../modules/deferredClickBeacon'
import { recordDownloadClickCorrelation } from '../modules/downloadClickCorrelation'
import { markDownloadCtaClicked } from '../modules/downloadPageExit'
import { SegmentEvent } from '../modules/segment'
import { buildClickPayload } from './adapters/clickPayload.helpers'
import { useDeferredTrack } from './useDeferredTrack'

interface UseDownloadClickOptions {
  /**
   * When true (default), records a `click_id`/`clicked_at` correlation in
   * sessionStorage and attaches it to the payload so `/download_success` (the
   * Explorer funnel) can join the click to its `download_*` events. Callers
   * whose funnel does NOT read that correlation back should pass `false` — e.g.
   * the Creator Hub hero, which redirects to `/download/creator-hub-success`
   * (a page that joins on `anon_user_id`, not `click_id`). Leaving it on there
   * would mint an orphan id and clobber the shared key the Explorer funnel uses.
   */
  recordCorrelation?: boolean
}

/**
 * Click adapter for download CTAs that navigate away immediately after the
 * handler runs. Warm clicks keep analytics-next context; cold clicks bypass the
 * component-scoped queue because navigation would tear it down.
 *
 * `isInitialized` is read through a ref (same pattern as `useDeferredTrack`) so
 * the returned handler keeps its identity when Segment becomes ready.
 */
function useDownloadClick(options: UseDownloadClickOptions = {}) {
  const { recordCorrelation = true } = options
  const { isInitialized } = useAnalytics()
  const deferredTrack = useDeferredTrack()
  const isInitializedRef = useRef(isInitialized)
  isInitializedRef.current = isInitialized

  return useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      // Feeds the download_page_exit diagnostic: /download resets this flag on
      // mount and reads it when the page becomes hidden.
      markDownloadCtaClicked()

      // Deterministic click → download_* correlation: the same click_id we
      // send here travels via sessionStorage to /download_success (see
      // downloadClickCorrelation.ts). clicked_at enables ms_since_click
      // downstream. Skipped when the caller's funnel doesn't consume it, so no
      // orphan id is minted (see UseDownloadClickOptions.recordCorrelation).
      const correlation = recordCorrelation ? recordDownloadClickCorrelation() : {}
      // Spread into a fresh object so the typed correlation interface satisfies
      // buildClickPayload's Record<string, unknown> `extra` parameter.
      const payload = buildClickPayload(event.currentTarget, { ...correlation })

      if (isInitializedRef.current) {
        deferredTrack(SegmentEvent.CLICK, payload)
        return
      }

      postDeferredClick(payload)
    },
    [deferredTrack, recordCorrelation]
  )
}

export { useDownloadClick }
