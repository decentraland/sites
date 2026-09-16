import { useCallback } from 'react'
import { SegmentEvent } from '../../modules/segment'
import { useDeferredTrack } from '../useDeferredTrack'
import { buildClickPayload } from './clickPayload.helpers'

/**
 * Click adapter consumed by interactive elements that follow the
 * `data-*` convention. Reads every `data-*` attribute on the clicked
 * element, camelCases each key, and ships the merged payload through
 * `useDeferredTrack` so calls that land before Segment is initialized
 * are queued instead of dropped.
 *
 * The event name is always `SegmentEvent.CLICK`. Action subtype lives in
 * the payload as `event` (sourced from `data-event`) so the data team can
 * group clicks by action without splitting them into separate event
 * families. To keep payloads tight, the `event` key is stripped when its
 * value would simply repeat the event name (`Click`).
 *
 * Callers should always set `data-event` to a `SegmentEvent` enum value
 * rather than a hardcoded literal — keeps casing consistent in the
 * warehouse and makes grep over the codebase trivial.
 *
 * The current URL's campaign (utm_*) params are merged first so a partner
 * link (`/create?utm_source=…`) attributes every tracked click, matching the
 * download-CTA behavior in `useDownloadClick`. `data-*` attributes are spread
 * last as the trusted, component-controlled source and win on collision; they
 * never collide with the snake_case utm_* keys because `readDataAttributes`
 * camelCases dashed names (see `collectCampaignParams`).
 */
function useTrackClick() {
  const deferredTrack = useDeferredTrack()
  return useCallback(
    // Accepts any SyntheticEvent (mouse, keyboard, …): only `currentTarget` is
    // read, so widening the type lets keyboard-activated controls (e.g. the FAQ
    // accordion) call this without a lossy cast, while `onClick={trackClick}`
    // still type-checks because a mouse event is a SyntheticEvent.
    (event: React.SyntheticEvent<HTMLElement>) => {
      deferredTrack(SegmentEvent.CLICK, buildClickPayload(event.currentTarget))
    },
    [deferredTrack]
  )
}

export { useTrackClick }
