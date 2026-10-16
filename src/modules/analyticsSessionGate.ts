import { isBotClient } from '@dcl/hooks'
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

// The two cases where AnalyticsProvider never boots: an exempt session (main.tsx passes no write key) and a bot.
// Events that are not conversions must not be sent by any other transport in those cases either.
function isAnalyticsOffForVisitor(): boolean {
  return analyticsDisabled || isBotClient(typeof navigator === 'undefined' ? undefined : navigator.userAgent)
}

export { isAnalyticsDisabledForSession, isAnalyticsOffForVisitor }
