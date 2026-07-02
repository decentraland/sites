import type { SegmentEvent } from './segment'
import { SEGMENT_TRACK_URL, getSegmentWriteKey } from './segmentConfig'

const BEACON_LIBRARY_NAME = 'dcl-sites-beacon'
const BEACON_LIBRARY_VERSION = '1.0.0'

interface SegmentBeaconPayload {
  writeKey: string
  event: SegmentEvent
  anonymousId: string
  properties: Record<string, unknown>
  messageId: string
  timestamp: string
  sentAt: string
  context: {
    page: {
      url: string
      path: string
      referrer: string
      title: string
    }
    userAgent: string
    locale: string
    library: {
      name: typeof BEACON_LIBRARY_NAME
      version: typeof BEACON_LIBRARY_VERSION
    }
  }
}

const createMessageId = (): string => {
  const randomId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${new Date().getTime()}-${Math.random().toString(36).slice(2)}`

  return `${BEACON_LIBRARY_NAME}-${randomId}`
}

const buildSegmentBeaconPayload = (
  writeKey: string,
  event: SegmentEvent,
  properties: Record<string, unknown>,
  anonymousId: string
): SegmentBeaconPayload => {
  const timestamp = new Date().toISOString()

  return {
    writeKey,
    event,
    anonymousId,
    properties,
    messageId: createMessageId(),
    timestamp,
    sentAt: timestamp,
    context: {
      page: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        title: typeof document !== 'undefined' ? document.title : ''
      },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      locale: typeof navigator !== 'undefined' ? navigator.language : '',
      library: {
        name: BEACON_LIBRARY_NAME,
        version: BEACON_LIBRARY_VERSION
      }
    }
  }
}

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

  const body = JSON.stringify(buildSegmentBeaconPayload(writeKey, event, properties, anonymousId))

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
