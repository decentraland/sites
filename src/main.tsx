import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { AnalyticsProvider } from '@dcl/hooks'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { App } from './App'
import { store } from './app/store'
import { getEnv } from './config/env'
import { LocaleProvider } from './intl/LocaleContext'

const segmentWriteKey = getEnv('SEGMENT_KEY') || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <DclThemeProvider theme={darkTheme}>
        <LocaleProvider>
          <AnalyticsProvider writeKey={segmentWriteKey}>
            <App />
          </AnalyticsProvider>
        </LocaleProvider>
      </DclThemeProvider>
    </Provider>
  </StrictMode>
)
