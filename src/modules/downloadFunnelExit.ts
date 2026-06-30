import { getEnv } from '../config/env'
import { isAnalyticsExemptPath } from '../utils/isAnalyticsExemptPath'
import { SegmentEvent } from './segment'
import type { DownloadFunnelExitData } from './downloadFunnelExit.types'

// Segment's HTTP Tracking API. Accepts the `writeKey` in the JSON body (no
// Authorization header), which is what lets `navigator.sendBeacon` — which
// cannot set headers — post to it.
const SEGMENT_TRACK_URL = 'https://api.segment.io/v1/track'

function getWriteKey(): string {
  // Mirror main.tsx: never emit analytics from exempt (pure legal/text) paths.
  if (typeof window !== 'undefined' && isAnalyticsExemptPath(window.location.pathname)) return ''
  return getEnv('SEGMENT_KEY') || ''
}

// Segment's HTTP API requires an identity. The funnel reliably threads
// `anon_user_id`, but on the rare row without one we mint a throwaway id purely
// so the event still lands — it is NOT a real user (don't count it as one).
function fallbackAnonymousId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `dl-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function buildBody(writeKey: string, data: DownloadFunnelExitData): string {
  /* eslint-disable @typescript-eslint/naming-convention */
  const properties: Record<string, unknown> = {
    os: data.os,
    arch: data.arch,
    place: data.place,
    download_started_fired: data.startedFired,
    download_success_fired: data.successFired,
    download_failed_fired: data.failedFired,
    ms_on_page: data.msOnPage,
    revisit: data.revisit,
    auth_state: data.authState
  }
  if (data.anonUserId) {
    properties.anon_user_id = data.anonUserId
  }
  /* eslint-enable @typescript-eslint/naming-convention */

  return JSON.stringify({
    writeKey,
    event: SegmentEvent.DOWNLOAD_FUNNEL_EXIT,
    anonymousId: data.anonUserId || fallbackAnonymousId(),
    properties
  })
}

/**
 * Fires the `download_funnel_exit` diagnostic event via an unload-safe
 * transport. Called from a `pagehide` handler, so `navigator.sendBeacon` is the
 * primary path (purpose-built for departure); `fetch` + `keepalive` is the
 * fallback for engines without sendBeacon. No-op when there is no write key.
 */
function sendDownloadFunnelExit(data: DownloadFunnelExitData): void {
  const writeKey = getWriteKey()
  if (!writeKey) return

  const body = buildBody(writeKey, data)

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    // text/plain avoids the CORS preflight sendBeacon can't satisfy; Segment
    // parses the JSON body regardless of the declared content-type.
    const queued = navigator.sendBeacon(SEGMENT_TRACK_URL, new Blob([body], { type: 'text/plain' }))
    if (queued) return
  }

  try {
    if (typeof fetch === 'function') {
      void fetch(SEGMENT_TRACK_URL, {
        method: 'POST',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        mode: 'cors',
        credentials: 'omit'
      }).catch(() => {
        // Best-effort diagnostic; a dropped exit beacon is acceptable.
      })
    }
  } catch {
    // fetch threw synchronously — nothing more we can do at unload.
  }
}

export { SEGMENT_TRACK_URL, sendDownloadFunnelExit }
