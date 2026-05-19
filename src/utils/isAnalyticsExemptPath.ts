// Pure static text routes (legal copy + Decentraland trademark policy) where
// no funnel, conversion, or engagement signal lives. We skip Segment +
// Contentsquare on cold loads to these paths so the third-party cookies and
// extra JS execution cost stop counting against Lighthouse there. Users who
// land on the homepage and navigate to a legal page still get tracked
// normally — the gate only applies to the initial pathname.
const ANALYTICS_EXEMPT_PATHS = new Set([
  '/brand',
  '/content',
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
