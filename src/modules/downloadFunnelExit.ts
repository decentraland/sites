import { SegmentEvent } from './segment'
import { SEGMENT_TRACK_URL, getSegmentWriteKey } from './segmentConfig'
import type { DownloadFunnelExitData } from './downloadFunnelExit.types'

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
 * transport. Called from a `visibilitychange → hidden` handler, so
 * `navigator.sendBeacon` is the primary path (purpose-built for departure);
 * `fetch` + `keepalive` is the fallback for engines without sendBeacon or when
 * the beacon queue is full. No-op when there is no write key.
 */
function sendDownloadFunnelExit(data: DownloadFunnelExitData): void {
  const writeKey = getSegmentWriteKey()
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
        // text/plain keeps this a CORS-simple request (no preflight), matching
        // the sendBeacon path above — an application/json content-type would
        // trigger an OPTIONS preflight that drops the request on unload, which
        // is exactly the cohort this diagnostic exists to capture.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { 'Content-Type': 'text/plain' },
        body,
        keepalive: true,
        mode: 'cors',
        credentials: 'omit'
      }).catch(() => {
        // Best-effort diagnostic; a dropped exit beacon (network error or a
        // non-2xx response) is acceptable and not worth acting on at unload.
      })
    }
  } catch {
    // fetch threw synchronously — nothing more we can do at unload.
  }
}

export { sendDownloadFunnelExit }
