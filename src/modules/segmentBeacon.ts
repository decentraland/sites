import type { SegmentEvent } from './segment'
import { SEGMENT_TRACK_URL, getSegmentWriteKey } from './segmentConfig'

/**
 * Posts a single Segment track event over an unload-safe transport.
 *
 * Use this only for events fired immediately before a page departure. Normal
 * in-page tracking should keep using analytics-next through useDeferredTrack so
 * Segment can attach its full context.
 */
function postSegmentEvent(event: SegmentEvent, properties: Record<string, unknown>, anonymousId: string): void {
  const writeKey = getSegmentWriteKey()
  if (!writeKey) return

  const body = JSON.stringify({ writeKey, event, anonymousId, properties })

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    // text/plain keeps the request CORS-simple; application/json would preflight,
    // which is unsafe during unload.
    const queued = navigator.sendBeacon(SEGMENT_TRACK_URL, new Blob([body], { type: 'text/plain' }))
    if (queued) return
  }

  try {
    if (typeof fetch === 'function') {
      void fetch(SEGMENT_TRACK_URL, {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'text/plain' },
        body,
        keepalive: true,
        mode: 'cors',
        credentials: 'omit'
      }).catch(() => {
        // Best effort at unload.
      })
    }
  } catch {
    // Best effort at unload.
  }
}

export { postSegmentEvent }
