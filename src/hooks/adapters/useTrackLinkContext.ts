import { useCallback } from 'react'
import { SegmentEvent } from '../../modules/segment'
import { useDeferredTrack } from '../useDeferredTrack'
import { readDataAttributes } from './readDataAttributes'

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
      const { downloadTarget, ...payload }: Record<string, unknown> = readDataAttributes(event.currentTarget)

      if (payload.event === SegmentEvent.CLICK) {
        delete payload.event
      }

      // `readDataAttributes` camelCases `data-download-target`; the warehouse
      // dimensions by snake_case. Same rename as useDownloadClick.
      if (downloadTarget) {
        payload.download_target = downloadTarget
      }

      deferredTrack(SegmentEvent.CLICK, payload)
    },
    [deferredTrack]
  )
}

export { useTrackClick }
