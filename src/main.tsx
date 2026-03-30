import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IntlProvider } from 'react-intl'
import { Provider } from 'react-redux'
import { WalletStateProvider } from '@dcl/core-web3/lazy'
import { AnalyticsProvider } from '@dcl/hooks'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { App } from './App'
import { store } from './app/store'
import { getEnv } from './config/env'
import { LazyWeb3 } from './features/web3/LazyWeb3'
import messagesData from './intl/en.json'
import { flattenMessages } from './intl/flatten'

const messages = flattenMessages(messagesData)
const segmentWriteKey = getEnv('VITE_SEGMENT_WRITE_KEY') || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <WalletStateProvider>
        <LazyWeb3>
          <DclThemeProvider theme={darkTheme}>
            <IntlProvider locale="en" messages={messages}>
              <AnalyticsProvider writeKey={segmentWriteKey}>
                <App />
              </AnalyticsProvider>
            </IntlProvider>
          </DclThemeProvider>
        </LazyWeb3>
      </WalletStateProvider>
    </Provider>
  </StrictMode>
)
