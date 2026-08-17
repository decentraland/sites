import { getEnv } from '../config/env'
import { isAnalyticsExemptPath } from '../utils/isAnalyticsExemptPath'

// Segment's HTTP Tracking API endpoint. Accepts the public `writeKey` in the
// JSON body (no Authorization header), which is what lets transports that
// cannot set headers — `navigator.sendBeacon` — post to it.
const DEFAULT_SEGMENT_TRACK_URL = 'https://api.segment.io/v1/track'

const PROTOCOL_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//i
const TRAILING_SLASHES = /\/+$/

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
 * Both proxy values decide where a third-party script is loaded from and where
 * every event is delivered, so they are read from the build configuration and
 * never from user input. A value that is not an absolute https URL is dropped
 * with a warning, so a misconfigured environment degrades to Segment's own
 * endpoints instead of pointing the SDK at an untrusted host.
 */
function resolveProxyUrl(name: string, value: string): URL | undefined {
  let resolved: URL

  try {
    resolved = new URL(value)
  } catch {
    console.warn(`[Analytics] Ignoring the ${name} "${value}", it is not a valid URL`)
    return undefined
  }

  if (resolved.protocol !== 'https:') {
    console.warn(`[Analytics] Ignoring the ${name} "${value}", it is not served over https`)
    return undefined
  }

  return resolved
}

/**
 * Origin the Segment SDK fetches its project settings and its remote plugins
 * from, instead of `cdn.segment.com`, which ad-blocker filter lists match.
 * The SDK appends `/v1/projects/${writeKey}/settings` to it, so the trailing
 * slash is dropped to keep the separator single.
 *
 * Returns `undefined` when unconfigured or rejected, which keeps Segment's CDN.
 */
function getSegmentCdnUrl(): string | undefined {
  const cdnUrl = getEnv('SEGMENT_CDN_URL')
  if (!cdnUrl) {
    return undefined
  }

  return resolveProxyUrl('cdn url', cdnUrl)?.href.replace(TRAILING_SLASHES, '')
}

/**
 * Host the Segment SDK delivers events to, instead of `api.segment.io/v1`.
 * Format: `host/basePath` without protocol; the SDK prepends `https://` and
 * appends the method path (`/t`, `/i`, `/p`).
 *
 * Returns `undefined` when unconfigured or rejected, same as `getSegmentCdnUrl`.
 *
 * NOTE: unset in every environment today. The proxy serves the CDN
 * (bundle, settings, remote plugins) but returns 404 on the ingestion paths, so
 * pointing events at it drops all of them. Set it once the proxy accepts them.
 */
function getSegmentApiHost(): string | undefined {
  const apiHost = getEnv('SEGMENT_API_HOST')
  if (!apiHost) {
    return undefined
  }

  // The SDK takes it without a protocol and prepends its own, so a configured
  // one is accepted and stripped instead of producing `https://https://host`.
  const resolved = resolveProxyUrl('api host', PROTOCOL_PREFIX.test(apiHost) ? apiHost : `https://${apiHost}`)

  return resolved && `${resolved.host}${resolved.pathname}`.replace(TRAILING_SLASHES, '')
}

/**
 * Full URL for the Segment HTTP Tracking API track endpoint used by the beacon
 * transport (`segmentBeacon.ts`), which posts outside the SDK so it survives
 * unload. Derived from the same host the SDK uses, so both transports agree on
 * where events go and fall back together.
 */
function getSegmentTrackUrl(): string {
  const apiHost = getSegmentApiHost()
  return apiHost ? `https://${apiHost}/track` : DEFAULT_SEGMENT_TRACK_URL
}

export { DEFAULT_SEGMENT_TRACK_URL, getSegmentApiHost, getSegmentCdnUrl, getSegmentTrackUrl, getSegmentWriteKey }
