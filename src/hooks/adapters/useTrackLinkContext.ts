import { useCallback } from 'react'
import { SegmentEvent } from '../../modules/segment'
import { useDeferredTrack } from '../useDeferredTrack'

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
 */
function useTrackClick() {
  const deferredTrack = useDeferredTrack()
  return useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const element = event.currentTarget
      const payload: Record<string, string | null> = {}

      Array.from(element.attributes).forEach(attr => {
        if (!attr.name.startsWith('data-')) return
        // Skip empty string attributes — components like BannerButton set
        // `data-title=""` / `data-subtitle=""` as placeholders when the
        // metadata isn't applicable. Forwarding empty strings to the
        // warehouse creates noise without analytic value.
        if (attr.value === '') return
        const key = attr.name
          .slice(5)
          .split('-')
          .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
          .join('')
        payload[key] = attr.value
      })

      if (payload.event === SegmentEvent.CLICK) {
        delete payload.event
      }

      deferredTrack(SegmentEvent.CLICK, payload)
    },
    [deferredTrack]
  )
}

export { useTrackClick }
