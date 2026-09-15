import type { Breadcrumb, ErrorEvent, StackFrame } from '@sentry/browser'

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

// Segment loads each analytics destination as a remote bundle. When an ad blocker, a
// DNS filter or a captive portal blocks the Google tag, that loader rejects a promise
// nobody handles, so it lands in Sentry as an unhandled error. Nothing to fix on our
// side, and it is the noisiest event in the project.
//
// Keyed on the message alone, deliberately. Two earlier versions also demanded a stack
// frame from Segment's loader and both broke:
//
//   1. `browser-destination-runtime` (#739) never matched at all. That path only
//      exists after Sentry resolves Segment's source maps server-side, and
//      `beforeSend` runs in the browser long before that.
//   2. `cdn.segment.com` (#745) worked until #747 moved Segment behind the
//      first-party proxy at `evs.e.decentraland.org`, which changed the frame's host
//      and silently turned the filter off again.
//
// The frame check never bought any safety either: `Failed to load` is emitted only by
// the destination loader, and pairing it with the blocked host means a genuine outage
// of any OTHER Segment destination carries a different URL and still reaches Sentry.
// Both halves have to appear on the same line for this to fire.
const BLOCKED_ANALYTICS_SCRIPT_REGEX = /Failed to load\b[^\n]*\b(?:googletagmanager|google-analytics)\.com/i

/**
 * True when an event is just "the Google tag was blocked", reported through
 * Segment's destination loader. Used by `beforeSend` to drop it.
 */
function isBlockedAnalyticsScriptError(event: ErrorEvent): boolean {
  const values = event.exception?.values ?? []
  // Chained exceptions put the useful text on a later value, so check them all.
  const messages = [event.message, ...values.map(value => value.value)]
  return messages.some(message => typeof message === 'string' && BLOCKED_ANALYTICS_SCRIPT_REGEX.test(message))
}

// `beforeSend` runs in the browser, so a frame's filename is the emitted chunk URL,
// not the `node_modules/@sentry-internal/replay` path the Sentry UI shows once it has
// resolved source maps server-side. Matching the package path here would never fire,
// which is exactly how the blocked-analytics filter silently broke twice (#739, #745).
// `vite.config.ts` bundles every @sentry package into this single manual chunk.
const SENTRY_CHUNK_REGEX = /\/vendor-sentry-[^/]*\.js/i

/**
 * True when every frame of the error belongs to the Sentry SDK itself.
 *
 * The SDK instruments the page, so it walks DOM the app never touches: Session Replay
 * reaching into a cross-origin iframe to observe its shadow DOM throws
 * `SecurityError: Blocked a frame with origin ...` on the newsletter embed
 * (SITES-2SN). Nothing of ours is on the stack and nothing of ours can fix it.
 *
 * The check is "every frame", not "any frame": the SDK wraps our event handlers, so
 * its wrapper shows up on plenty of genuine errors. Only a stack that never leaves
 * the Sentry chunk is a throw that originated inside the SDK.
 */
function collectFrames(event: ErrorEvent): StackFrame[] {
  return event.exception?.values?.flatMap(value => value.stacktrace?.frames ?? []) ?? []
}

function isSentrySdkError(event: ErrorEvent): boolean {
  const frames = collectFrames(event)
  if (frames.length === 0) return false
  return frames.every(frame => typeof frame.filename === 'string' && SENTRY_CHUNK_REGEX.test(frame.filename))
}

/**
 * True when no frame of the error points at a file.
 *
 * A script the browser evaluated rather than loaded leaves `<anonymous>` as the whole
 * stack: an extension, or the shim a TV browser injects (SITES-2SQ came from a Tizen
 * set, reporting `n.data.split is not a function` against code the page never
 * shipped). There is no file and no line, so the report cannot be opened, let alone
 * fixed. Everything we ship carries a chunk url.
 */
function isUnattributableError(event: ErrorEvent): boolean {
  const frames = collectFrames(event)
  if (frames.length === 0) return false
  return frames.every(frame => !frame.filename || frame.filename === '<anonymous>')
}

// A realtime transport that rejects with its own DOM `error` event instead of an
// Error. Sentry serializes the object into `extra.__serialized__`, so the target is
// what identifies it — the report itself carries no message and no stack.
const TRANSPORT_TARGET_REGEX = /^\[object (?:WebSocket|WebTransport)/

/**
 * True when an event is a promise rejected with a raw socket `error` event.
 *
 * `livekit-client` drives the scene viewer and cast, and when its signal socket
 * drops it rejects an internal promise with the DOM event rather than an Error
 * (SITES-2SF). What reaches Sentry is an untitled issue whose whole payload is
 * `{ isTrusted: true, target: '[object WebSocket]', type: 'error' }`: no message, no
 * stack, no frame of ours, and nothing to act on. A connection that actually matters
 * surfaces through the room's own state, which is what drives the reconnect toast.
 */
function isRawTransportRejection(event: ErrorEvent): boolean {
  const target = (event.extra?.__serialized__ as { target?: unknown } | undefined)?.target
  return typeof target === 'string' && TRANSPORT_TARGET_REGEX.test(target)
}

export {
  isBlockedAnalyticsScriptError,
  isRawTransportRejection,
  isSentrySdkError,
  isUnattributableError,
  redactBreadcrumbUrl,
  redactEventUrls,
  redactSensitiveUrl
}
