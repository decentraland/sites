import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { App } from './App'
import { LocaleProvider } from './intl/LocaleContext'
import { DeferredAnalyticsProvider } from './modules/DeferredAnalyticsProvider'
import { scheduleDeferredThirdParty } from './modules/deferredThirdParty'
import { getSegmentWriteKey } from './modules/segmentConfig'
import { isAnalyticsExemptPath } from './utils/isAnalyticsExemptPath'
import { scheduleWhenIdle } from './utils/scheduleWhenIdle'

// Pure legal/text routes have no funnel signal worth measuring and pay a
// disproportionate Lighthouse cost for the Segment + Contentsquare chains
// (third-party cookies, deferred JS execution). Skip both on cold loads to
// these paths; users who land on the homepage and navigate to them via SPA
// still keep analytics enabled.
const analyticsDisabled = isAnalyticsExemptPath(window.location.pathname)
const segmentWriteKey = getSegmentWriteKey()

// Sentry adds ~110 KB to the critical JS. Defer the init to idle so the
// vendor-sentry chunk doesn't compete with the LCP image and the lazy
// DappsShell chunk on slower networks. The 2 s timeout caps the no-capture
// window — most errors thrown during boot still surface in the browser
// console even before Sentry initializes.
scheduleWhenIdle(
  () => {
    void import('./modules/sentry')
  },
  { timeout: 2000 }
)

if (!analyticsDisabled) {
  scheduleDeferredThirdParty()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DclThemeProvider theme={darkTheme}>
      <LocaleProvider>
        <DeferredAnalyticsProvider writeKey={segmentWriteKey}>
          <App />
        </DeferredAnalyticsProvider>
      </LocaleProvider>
    </DclThemeProvider>
  </StrictMode>
)
