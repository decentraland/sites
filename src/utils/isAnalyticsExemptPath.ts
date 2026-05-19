// Routes where no funnel, conversion, or engagement signal lives on cold load.
// Skipping Segment + Contentsquare here removes the third-party cookies and
// idle JS execution cost they impose on Lighthouse. Users who land on the
// homepage and navigate to one of these via SPA still get tracked normally —
// the gate only applies to the initial pathname.
//
// /download lives here too: the download event is fired server-side from the
// installer's first-run telemetry, so client-side Segment on the page itself
// only duplicates the signal while doubling third-party cookie noise.
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
