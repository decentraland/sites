import * as React from 'react'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'
import { AnalyticsProvider } from '@dcl/hooks'
import * as ReactDOM from 'react-dom/client'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { App } from './App'
import { store } from './app/store'
import { getEnv } from './config/env'
import messagesData from './intl/en.json'
import { flattenMessages } from './intl/flatten'

const messages = flattenMessages(messagesData)
const segmentWriteKey = getEnv('VITE_SEGMENT_WRITE_KEY') || ''

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <DclThemeProvider theme={darkTheme}>
        <IntlProvider locale="en" messages={messages}>
          <AnalyticsProvider writeKey={segmentWriteKey}>
            <App />
          </AnalyticsProvider>
        </IntlProvider>
      </DclThemeProvider>
    </Provider>
  </React.StrictMode>
)
