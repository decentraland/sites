import { useCallback } from 'react'
import { enqueueDownloadBeacon, generateDownloadEventId } from '../modules/downloadBeacon'
import type { DownloadTrackFn } from '../modules/downloadTracking.types'
import { useDeferredTrack } from './useDeferredTrack'

/**
 * Track function for the download funnel that delivers each event two ways:
 *
 * 1. **Primary — analytics.js** (via `useDeferredTrack`): reaches device-mode
 *    destinations (e.g. conversion pixels) when Segment is loaded, and the
 *    warehouse. Lost if the user leaves before Segment boots / flushes.
 * 2. **Safety net — unload-safe beacon** (`enqueueDownloadBeacon`): replayed
 *    to Segment's HTTP Tracking API when the page is hidden, so the event
 *    survives the user bouncing off `/download_success` the instant the file
 *    lands.
 *
 * Both copies carry the same `download_event_id`; the warehouse dedupes on it
 * (analytics.js auto-generates its own Segment messageId, which we can't
 * override through `@dcl/hooks`, so native messageId dedup isn't available —
 * the property key is the dedup contract instead).
 *
 * Drop-in compatible with `useDeferredTrack`'s signature so it can be passed
 * straight into `createDownloadTracker`.
 */
function useDownloadEventTrack(): DownloadTrackFn {
  const deferredTrack = useDeferredTrack()

  return useCallback<DownloadTrackFn>(
    (event, payload) => {
      const eventId = generateDownloadEventId()
      const anonUserId = payload.anon_user_id
      const enriched: Record<string, unknown> = {
        ...payload,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        download_event_id: eventId
      }

      deferredTrack(event, enriched)

      enqueueDownloadBeacon({
        event,
        properties: enriched,
        anonymousId: typeof anonUserId === 'string' ? anonUserId : undefined,
        eventId
      })
    },
    [deferredTrack]
  )
}

export { useDownloadEventTrack }
