import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { App } from './App'
import { getEnv } from './config/env'
import { LocaleProvider } from './intl/LocaleContext'
import { DeferredAnalyticsProvider } from './modules/DeferredAnalyticsProvider'
import { scheduleDeferredThirdParty } from './modules/deferredThirdParty'
import { scheduleWhenIdle } from './utils/scheduleWhenIdle'

const segmentWriteKey = getEnv('SEGMENT_KEY') || ''

// Sentry adds ~110 KB to the critical JS. Defer the init to idle time so the
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

scheduleDeferredThirdParty()

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
