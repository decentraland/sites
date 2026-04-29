import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { App } from './App'
import { getEnv } from './config/env'
import { LocaleProvider } from './intl/LocaleContext'
import { DeferredAnalyticsProvider } from './modules/DeferredAnalyticsProvider'
import { scheduleDeferredThirdParty } from './modules/deferredThirdParty'
import './modules/sentry'

const segmentWriteKey = getEnv('SEGMENT_KEY') || ''

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
