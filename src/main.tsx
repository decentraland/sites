import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'
import { Web3CoreProvider, Web3SyncProvider } from '@dcl/core-web3'
import { AnalyticsProvider } from '@dcl/hooks'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { App } from './App'
import { store } from './app/store'
import { getEnv } from './config/env'
import { web3Config } from './features/web3/web3.config'
import messagesData from './intl/en.json'
import { flattenMessages } from './intl/flatten'

const messages = flattenMessages(messagesData)
const segmentWriteKey = getEnv('VITE_SEGMENT_WRITE_KEY') || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Web3CoreProvider config={web3Config}>
        <Web3SyncProvider>
          <DclThemeProvider theme={darkTheme}>
            <IntlProvider locale="en" messages={messages}>
              <AnalyticsProvider writeKey={segmentWriteKey}>
                <App />
              </AnalyticsProvider>
            </IntlProvider>
          </DclThemeProvider>
        </Web3SyncProvider>
      </Web3CoreProvider>
    </Provider>
  </StrictMode>
)
