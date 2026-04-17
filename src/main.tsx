import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AnalyticsProvider } from '@dcl/hooks'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { App } from './App'
import { getEnv } from './config/env'
import { LocaleProvider } from './intl/LocaleContext'
import './modules/sentry'

const segmentWriteKey = getEnv('SEGMENT_KEY') || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DclThemeProvider theme={darkTheme}>
      <LocaleProvider>
        <AnalyticsProvider writeKey={segmentWriteKey}>
          <App />
        </AnalyticsProvider>
      </LocaleProvider>
    </DclThemeProvider>
  </StrictMode>
)
