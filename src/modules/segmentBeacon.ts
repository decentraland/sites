import type { SegmentEvent } from './segment'
import { SEGMENT_TRACK_URL, getSegmentWriteKey } from './segmentConfig'
import { resolveSegmentUserId } from './segmentUserId'

const BEACON_LIBRARY_NAME = 'dcl-sites-beacon'
const BEACON_LIBRARY_VERSION = '1.0.0'

// Low-entropy slice of `navigator.userAgentData` (Chromium-only, synchronous —
// no `getHighEntropyValues` await). Mirrors what analytics-next attaches to its
// SDK-sent events so device breakdowns in the warehouse line up across the
// beacon and SDK transports. Not in the TS DOM lib yet, so declared locally.
interface UserAgentDataBrand {
  brand: string
  version: string
}
interface NavigatorUAData {
  brands?: UserAgentDataBrand[]
  mobile?: boolean
  platform?: string
}

interface SegmentBeaconContext {
  page: {
    url: string
    path: string
    search: string
    referrer: string
    title: string
  }
  userAgent: string
  userAgentData?: NavigatorUAData
  locale: string
  timezone?: string
  library: {
    name: typeof BEACON_LIBRARY_NAME
    version: typeof BEACON_LIBRARY_VERSION
  }
}

interface SegmentBeaconPayload {
  writeKey: string
  event: SegmentEvent
  // Present only for identified visitors — matches the SDK, which sends the
  // connected wallet as `userId` and omits it when anonymous.
  userId?: string
  anonymousId: string
  integrations: Record<string, never>
  properties: Record<string, unknown>
  messageId: string
  timestamp: string
  sentAt: string
  context: SegmentBeaconContext
}

interface SegmentBeaconInput {
  writeKey: string
  event: SegmentEvent
  properties: Record<string, unknown>
  anonymousId: string
  userId?: string
}

const createMessageId = (): string => {
  const randomId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${new Date().getTime()}-${Math.random().toString(36).slice(2)}`

  return `${BEACON_LIBRARY_NAME}-${randomId}`
}

// IANA timezone the SDK attaches as `context.timezone`. Best-effort: returns
// undefined if the runtime can't resolve it so the field is simply omitted.
const resolveTimezone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}

const resolveUserAgentData = (): NavigatorUAData | undefined => {
  if (typeof navigator === 'undefined') return undefined
  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData
  if (!uaData) return undefined
  const { brands, mobile, platform } = uaData
  return { brands, mobile, platform }
}

const buildSegmentBeaconPayload = (input: SegmentBeaconInput): SegmentBeaconPayload => {
  const { writeKey, event, properties, anonymousId, userId } = input
  const timestamp = new Date().toISOString()
  const timezone = resolveTimezone()
  const userAgentData = resolveUserAgentData()

  return {
    writeKey,
    event,
    ...(userId ? { userId } : {}),
    anonymousId,
    integrations: {},
    properties,
    messageId: createMessageId(),
    timestamp,
    sentAt: timestamp,
    context: {
      page: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        search: typeof window !== 'undefined' ? window.location.search : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        title: typeof document !== 'undefined' ? document.title : ''
      },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      ...(userAgentData ? { userAgentData } : {}),
      locale: typeof navigator !== 'undefined' ? navigator.language : '',
      ...(timezone ? { timezone } : {}),
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
 *
 * The identified `userId` (connected wallet) is resolved here from the SDK's own
 * `ajs_user_id` key so every beacon event carries the same wallet the SDK-sent
 * `page`/`track` events do — the beacon bypasses analytics-next, which would
 * otherwise attach it automatically. See `resolveSegmentUserId`.
 */
function postSegmentEvent(event: SegmentEvent, properties: Record<string, unknown>, anonymousId: string): void {
  // NOTE: bypasses the analytics-exempt-path gate on purpose. Every caller of
  // this transport fires an explicit conversion event (download CTA click,
  // funnel exit, download_started/_success/_failed) — the gate exists to
  // suppress the automatic analytics boot on pure-text pages, and /download
  // (exempt for Lighthouse) hosts download CTAs whose clicks must still land.
  const writeKey = getSegmentWriteKey({ bypassExemptPathGate: true })
  if (!writeKey) return

  const userId = resolveSegmentUserId()
  const body = JSON.stringify(buildSegmentBeaconPayload({ writeKey, event, properties, anonymousId, userId }))

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
