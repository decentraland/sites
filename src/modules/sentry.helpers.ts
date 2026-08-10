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

export { redactBreadcrumbUrl, redactEventUrls, redactSensitiveUrl }
