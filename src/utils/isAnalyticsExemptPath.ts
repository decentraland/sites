// Routes where no funnel, conversion, or engagement signal lives on cold load.
// Skipping Segment + Contentsquare here removes the third-party cookies and
// idle JS execution cost they impose on Lighthouse. Users who land on the
// homepage and navigate to one of these via SPA still get tracked normally —
// the gate only applies to the initial pathname.
//
// /download lives here too, intentionally: keeping it exempt avoids Segment's
// cold-boot cost (third-party cookies + idle JS) on a page adjacent to the
// homepage. It is NOT a tracking blind spot — the download CTAs on /download
// (desktop installer + mobile App Store / Google Play store exits) are tracked
// via useDownloadClick's unload-safe beacon transport (postSegmentEvent +
// ensureSegmentAnonymousId), which fires regardless of whether Segment has
// booted and survives the immediate navigation. That path is what carries
// partner UTM attribution off this page, so removing /download from this set
// (which would boot Segment on cold load) is unnecessary and would regress the
// perf/privacy win.
//
// MAINTENANCE: This list is a hand-curated allowlist, not derived from the
// router. If you add a new pure-text route (e.g. a new legal page) and want
// it to skip analytics, add the pathname here. Conversely, if a route on
// this list starts hosting a funnel CTA or conversion event, remove it so
// Segment captures the signal. Keep the entries sorted alphabetically.
const ANALYTICS_EXEMPT_PATHS = new Set([
  '/brand',
  '/content',
  '/download',
  '/ethics',
  '/privacy',
  '/referral-terms',
  '/rewards-terms',
  '/security',
  '/terms'
])

function isAnalyticsExemptPath(pathname: string): boolean {
  if (!pathname) return false
  const normalized = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return ANALYTICS_EXEMPT_PATHS.has(normalized)
}

export { isAnalyticsExemptPath }
