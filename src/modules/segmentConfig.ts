import { getEnv } from '../config/env'
import { isAnalyticsExemptPath } from '../utils/isAnalyticsExemptPath'

// Segment's HTTP Tracking API endpoint. Accepts the public `writeKey` in the
// JSON body (no Authorization header), which is what lets transports that
// cannot set headers — `navigator.sendBeacon` — post to it. Lives here rather
// than inline in a feature module so the one direct-HTTP caller and any future
// one share a single literal.
const SEGMENT_TRACK_URL = 'https://api.segment.io/v1/track'

/**
 * Single source of truth for the public Segment write key on the current page.
 * Mirrors the boot-time gate in `main.tsx`: analytics is suppressed on exempt
 * (pure legal/text) paths, so the key resolves to `''` there. Anything that
 * emits to Segment resolves the key through this helper instead of reading
 * `SEGMENT_KEY` itself, so the exempt-path rule is defined once.
 *
 * The exempt gate targets the AUTOMATIC analytics boot (page tracking,
 * third-party cookies, idle JS) — not explicit conversion signals. Callers
 * that fire deliberate, user-initiated events (the download-CTA beacon in
 * `segmentBeacon.ts`) pass `bypassExemptPathGate: true`: without it, a cold
 * load of `/download` (an exempt path hosting download CTAs) silently dropped
 * every store-exit click, losing partner attribution.
 *
 * The key is a public client-side write key (already shipped in the bundle for
 * analytics.js); it is config, not a secret.
 */
function getSegmentWriteKey(options?: { bypassExemptPathGate?: boolean }): string {
  if (!options?.bypassExemptPathGate && typeof window !== 'undefined' && isAnalyticsExemptPath(window.location.pathname)) {
    return ''
  }
  return getEnv('SEGMENT_KEY') || ''
}

export { SEGMENT_TRACK_URL, getSegmentWriteKey }
