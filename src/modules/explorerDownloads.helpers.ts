// A conditional response reaching the app is not a failure of the counter: an
// intermediary answered the revalidation instead of the browser cache, so there is
// no body to parse but nothing is broken either.
const NOT_MODIFIED = 304

// Transport-level failures, where the request never reached a server that could
// answer. Matching on the message is the only option available: the platform
// reports all of them as a bare `TypeError` whose wording differs per engine
// (Chrome "Failed to fetch", Firefox "NetworkError when attempting to fetch
// resource", Safari "Load failed").
const TRANSPORT_FAILURE_PATTERN = /failed to fetch|networkerror|network error|load failed/i

const ABORT_ERROR_NAMES = new Set(['AbortError', 'TimeoutError'])

/** Failure of the download-counts endpoint, carrying the status so the reporter can judge it. */
class DownloadCountsHttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`HTTP error! status: ${status}`)
    this.name = 'DownloadCountsHttpError'
    this.status = status
  }
}

/**
 * Whether a download-counts failure is worth a Sentry event.
 *
 * The counter is decorative — every caller falls back to `+400K` — so an event only
 * earns its place when it points at something we could act on. What actually reached
 * Sentry was 315 events over five issues in two weeks (SITES-2R8, -2MN, -2MQ, -2N0,
 * -2RV), and the reporting endpoint was never at fault: the traffic was visitors
 * whose network never delivered the request (regions where the CDN is unreachable,
 * blockers, headless crawlers) plus a single 304.
 *
 * A real cdn-data outage still surfaces. The origin answers those with a 5xx, and an
 * unexpected payload still throws while parsing, both of which stay reportable.
 */
function isReportableDownloadCountsFailure(error: unknown): boolean {
  if (!(error instanceof Error)) return true
  if (ABORT_ERROR_NAMES.has(error.name)) return false
  if (TRANSPORT_FAILURE_PATTERN.test(error.message)) return false
  return !(error instanceof DownloadCountsHttpError && error.status === NOT_MODIFIED)
}

export { DownloadCountsHttpError, isReportableDownloadCountsFailure }
