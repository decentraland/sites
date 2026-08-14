import { getEnv } from '../config/env'
import { isAnalyticsExemptPath } from '../utils/isAnalyticsExemptPath'

const DEFAULT_SEGMENT_TRACK_URL = 'https://api.segment.io/v1/track'

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

/**
 * Returns the first-party CDN URL that `@segment/analytics-next` should use
 * to fetch project settings, instead of the default `cdn.segment.com`.
 *
 * When a first-party proxy is configured (e.g. `https://evs.e.decentraland.org`),
 * the SDK resolves settings from `${cdnURL}/v1/projects/${writeKey}/settings`,
 * avoiding ad-blocker filter lists that block `cdn.segment.com`.
 *
 * Returns `undefined` when unconfigured, which tells the SDK to use the default
 * Segment CDN.
 */
function getSegmentCdnUrl(): string | undefined {
  return getEnv('SEGMENT_CDN_URL') || undefined
}

/**
 * Returns the first-party API host that `@segment/analytics-next` should use
 * to deliver events, instead of the default `api.segment.io/v1`.
 *
 * Format: `host/basePath` without protocol (e.g. `evs.e.decentraland.org/v1`).
 * The SDK prepends `https://` and appends the method path (`/t`, `/i`, `/p`).
 *
 * Returns `undefined` when unconfigured, which tells the SDK to use the default
 * Segment ingestion endpoint.
 */
function getSegmentApiHost(): string | undefined {
  return getEnv('SEGMENT_API_HOST') || undefined
}

/**
 * Returns the full URL for the Segment HTTP Tracking API track endpoint.
 *
 * When a first-party proxy is configured via `SEGMENT_API_HOST`, the URL is
 * derived as `https://${apiHost}/track`. Otherwise falls back to the default
 * `https://api.segment.io/v1/track`.
 *
 * Used by the beacon transport (`segmentBeacon.ts`) and the download funnel
 * exit module for unload-safe event delivery.
 */
function getSegmentTrackUrl(): string {
  const apiHost = getEnv('SEGMENT_API_HOST')
  return apiHost ? `https://${apiHost}/track` : DEFAULT_SEGMENT_TRACK_URL
}

export { DEFAULT_SEGMENT_TRACK_URL, getSegmentApiHost, getSegmentCdnUrl, getSegmentTrackUrl, getSegmentWriteKey }
