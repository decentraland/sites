import { getEnv } from '../config/env'
import { subscribeVisibility } from '../utils/documentVisibility'
import { isAnalyticsExemptPath } from '../utils/isAnalyticsExemptPath'
import type { DownloadBeaconEvent } from './downloadBeacon.types'

// Segment's HTTP Tracking API. Accepts the `writeKey` in the JSON body (no
// Authorization header required), which is what lets `navigator.sendBeacon`
// — which cannot set headers — fall back to it.
const SEGMENT_TRACK_URL = 'https://api.segment.io/v1/track'

// Download funnel events fired through analytics.js but not yet known to have
// reached the network. analytics.js batches its sends and the deferred-init
// queue is dropped if the user leaves before Segment boots, so these events
// are the ones at risk of being lost on `/download_success` (the user bounces
// the instant the file lands). We replay them via an unload-safe transport
// when the page is hidden; each carries a `download_event_id` so Segment / the
// warehouse dedupes the replay against the analytics.js copy.
const pending: DownloadBeaconEvent[] = []

let listenersInstalled = false

/**
 * Generates the per-event idempotency key. `crypto.randomUUID` is available in
 * every browser we target (Chrome 92+, Safari 15.4+, Firefox 95+); the
 * fallback covers older engines without it.
 */
function generateDownloadEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `dl-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getWriteKey(): string {
  // Mirror main.tsx: never emit analytics from exempt (pure legal/text) paths.
  if (typeof window !== 'undefined' && isAnalyticsExemptPath(window.location.pathname)) return ''
  return getEnv('SEGMENT_KEY') || ''
}

function buildBody(writeKey: string, item: DownloadBeaconEvent): string {
  return JSON.stringify({
    writeKey,
    event: item.event,
    // Segment's HTTP API rejects events with no identity, so we must always
    // send one. The shared anon id keeps the beaconed copy joinable to the
    // analytics.js copy. When it is genuinely absent (rare — the funnel threads
    // anon_user_id through the URL) we fall back to `eventId` purely so the
    // event lands. NOTE: that fallback is a synthetic per-event id, NOT a real
    // user — unique-user counts must key on `properties.anon_user_id` (absent
    // on these rows) and can exclude them via `delivery_transport = 'beacon'`.
    anonymousId: item.anonymousId || item.eventId,
    // Beacon-only marker so the data team can measure how often the beacon was
    // the SOLE delivery (i.e. quantify events recovered from abandonment) and
    // can tell beacon-origin rows apart from analytics.js-origin rows.
    properties: {
      ...item.properties,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      delivery_transport: 'beacon'
    },
    // Beacon idempotency key. NOTE: cross-transport dedup keys on
    // `properties.download_event_id`, NOT this messageId — analytics.js
    // auto-generates its own messageId we can't override through @dcl/hooks.
    messageId: item.eventId,
    context: {
      library: { name: 'sites-download-beacon', version: '1' }
    }
  })
}

/**
 * Sends one event body using the most reliable unload-safe transport
 * available. Prefers `fetch` with `keepalive` (allows `application/json` +
 * survives unload up to ~64KB, far above our payload), falling back to
 * `navigator.sendBeacon` with a `text/plain` blob to dodge the CORS preflight
 * sendBeacon can't satisfy (Segment parses the JSON regardless of declared
 * content-type).
 */
function transmit(body: string): void {
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
        // Best-effort: a failed beacon is no worse than the dropped event it
        // is trying to recover. Swallow so it never surfaces to the user.
      })
      return
    }
  } catch {
    // fetch threw synchronously (unsupported options) — fall through.
  }

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon(SEGMENT_TRACK_URL, new Blob([body], { type: 'text/plain' }))
  }
}

/**
 * Replays every pending download event via the unload-safe transport, then
 * clears the queue. Safe to call repeatedly (no-op when empty); always drains
 * so a disabled-analytics context can't accumulate forever, and skips
 * transmission when there is no write key.
 */
function flushDownloadBeacons(): void {
  if (pending.length === 0) return
  const writeKey = getWriteKey()
  const items = pending.splice(0, pending.length)
  if (!writeKey) return
  items.forEach(item => transmit(buildBody(writeKey, item)))
}

function ensureListeners(): void {
  if (listenersInstalled || typeof window === 'undefined') return
  listenersInstalled = true
  // `visibilitychange` → hidden is the most reliable "page going away" signal
  // across tab-close, navigation and mobile/bfcache discards. `pagehide`
  // covers the hard-unload path some engines don't precede with a visibility
  // change. flushDownloadBeacons is idempotent, so a double-trigger is safe.
  subscribeVisibility(visible => {
    if (!visible) flushDownloadBeacons()
  })
  window.addEventListener('pagehide', flushDownloadBeacons)
}

/**
 * Queues a download funnel event for unload-safe replay and ensures the
 * page-visibility listeners that drain the queue are installed.
 */
function enqueueDownloadBeacon(item: DownloadBeaconEvent): void {
  pending.push(item)
  ensureListeners()
}

export { SEGMENT_TRACK_URL, enqueueDownloadBeacon, flushDownloadBeacons, generateDownloadEventId }
