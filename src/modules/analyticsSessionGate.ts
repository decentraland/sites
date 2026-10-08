import { isAnalyticsExemptPath } from '../utils/isAnalyticsExemptPath'

// Pure legal/text routes have no funnel signal worth measuring and pay a
// disproportionate Lighthouse cost for the Segment + Contentsquare chains
// (third-party cookies, deferred JS execution). Both stay off for the whole
// session when it starts on one of them; a session that starts elsewhere and
// navigates to one in-app keeps analytics on. Decided once, from the URL the
// session first loaded, so every caller reads the same answer after in-app
// navigation. main.tsx imports this module statically, which fixes that URL.
const analyticsDisabled = typeof window !== 'undefined' && isAnalyticsExemptPath(window.location.pathname)

function isAnalyticsDisabledForSession(): boolean {
  return analyticsDisabled
}

export { isAnalyticsDisabledForSession }
