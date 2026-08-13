import type { Breadcrumb, ErrorEvent } from '@sentry/browser'

const REDACTED = '[redacted]'

/**
 * URL paths that carry a single-use credential in a route segment. Sentry stores
 * `request.url` plus every navigation/fetch breadcrumb, and Session Replay records
 * the URL of each page it captures — so these have to be scrubbed in the browser
 * before an event leaves it.
 *
 * Wallet addresses (`/invite/:referrer`, `/storage/players/:address`) are left
 * intact on purpose: they are public on-chain identifiers that already appear in
 * shared links, and redacting them would blind the referral-funnel debugging that
 * these events exist to support.
 */
const SENSITIVE_PATH_PATTERNS: readonly { readonly pattern: RegExp; readonly replacement: string }[] = [
  // /cast/s/<livekit token> is a bearer credential for the streaming room.
  // `s/streaming` is a literal route rather than a token, so keep it readable.
  { pattern: /\/cast\/s\/(?!streaming(?:[/?#]|$))[^/?#]+/gi, replacement: `/cast/s/${REDACTED}` },
  // The three /account/*/:token routes are email-confirmation links sent by mail.
  // Longest alternative first — regex alternation takes the first match.
  {
    pattern: /\/account\/(confirm-email-challenge|confirm-email|credits-email-confirmed)\/[^/?#]+/gi,
    replacement: `/account/$1/${REDACTED}`
  }
]

const SENSITIVE_QUERY_KEYS = new Set([
  'access_token',
  'code',
  'email',
  'id_token',
  'key',
  'password',
  'refresh_token',
  'secret',
  'signature',
  'token'
])

// `new URL()` needs an origin to parse a relative URL. This host is never
// contacted — it only anchors the parse so `searchParams` is usable.
const FALLBACK_ORIGIN = 'https://redacted.invalid'

const ABSOLUTE_URL_REGEX = /^[a-z][a-z\d+.-]*:/i

function redactQueryParams(url: string): string {
  if (!url.includes('?')) return url
  try {
    const isAbsolute = ABSOLUTE_URL_REGEX.test(url)
    const parsed = new URL(url, FALLBACK_ORIGIN)
    let didRedact = false
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (!SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) continue
      parsed.searchParams.set(key, REDACTED)
      didRedact = true
    }
    if (!didRedact) return url
    return isAbsolute ? parsed.toString() : `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    // An unparseable URL still had its sensitive path segments stripped by the
    // caller, so returning it as-is leaks nothing the patterns already cover.
    return url
  }
}

/** Strips credential path segments and sensitive query values from a URL. */
function redactSensitiveUrl(url: string): string {
  const withRedactedPaths = SENSITIVE_PATH_PATTERNS.reduce((result, { pattern, replacement }) => result.replace(pattern, replacement), url)
  return redactQueryParams(withRedactedPaths)
}

/** Scrubs the URL a breadcrumb recorded, leaving every other field untouched. */
function redactBreadcrumbUrl(breadcrumb: Breadcrumb): Breadcrumb {
  const { data } = breadcrumb
  if (typeof data?.url !== 'string') return breadcrumb
  return { ...breadcrumb, data: { ...data, url: redactSensitiveUrl(data.url) } }
}

/** Scrubs the request URL and every breadcrumb URL on an outgoing event. */
function redactEventUrls(event: ErrorEvent): ErrorEvent {
  const redacted: ErrorEvent = { ...event }
  if (typeof event.request?.url === 'string') {
    redacted.request = { ...event.request, url: redactSensitiveUrl(event.request.url) }
  }
  if (event.breadcrumbs) {
    redacted.breadcrumbs = event.breadcrumbs.map(redactBreadcrumbUrl)
  }
  return redacted
}

// Segment loads each analytics destination as a remote bundle off its own CDN. When
// an ad blocker, a DNS filter or a captive portal blocks the Google tag, that loader
// rejects a promise nobody handles, so it lands in Sentry as an unhandled error
// whose only frame belongs to the vendor bundle. There is nothing to fix on our side.
//
// Match the CDN host rather than the loader's source path. `beforeSend` runs in the
// browser, where the frame is still the minified bundle URL
// (`https://cdn.segment.com/next-integrations/actions/<id>/<hash>.js`); the readable
// `browser-destination-runtime/dist/esm/load-script.js` path shown in the Sentry UI
// only exists after Sentry resolves Segment's source maps server-side, long after
// this filter has run. Keying on that path is what made the check a no-op.
const SEGMENT_DESTINATION_CDN_HOST = 'cdn.segment.com'

const BLOCKED_ANALYTICS_HOST_REGEX = /googletagmanager\.com|google-analytics\.com/i

/**
 * True when an event is just "the Google tag was blocked", reported through
 * Segment's destination loader. Used by `beforeSend` to drop it.
 *
 * Deliberately narrow: the frame alone would also swallow a real outage of any
 * OTHER Segment destination, so the blocked host has to match too.
 */
function isBlockedAnalyticsScriptError(event: ErrorEvent): boolean {
  const values = event.exception?.values ?? []
  const hasLoaderFrame = values.some(value =>
    value.stacktrace?.frames?.some(frame => frame.filename?.includes(SEGMENT_DESTINATION_CDN_HOST))
  )
  if (!hasLoaderFrame) return false
  // Chained exceptions put the useful text on a later value, so check them all.
  const messages = [event.message, ...values.map(value => value.value)]
  return messages.some(message => typeof message === 'string' && BLOCKED_ANALYTICS_HOST_REGEX.test(message))
}

export { isBlockedAnalyticsScriptError, redactBreadcrumbUrl, redactEventUrls, redactSensitiveUrl }
