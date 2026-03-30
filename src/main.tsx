import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { WalletStateProvider } from '@dcl/core-web3/lazy'
import { AnalyticsProvider } from '@dcl/hooks'
import { DclThemeProvider, darkTheme } from 'decentraland-ui2'
import { App } from './App'
import { store } from './app/store'
import { getEnv } from './config/env'
import { LazyWeb3 } from './features/web3/LazyWeb3'
import { LocaleProvider } from './intl/LocaleContext'

const segmentWriteKey = getEnv('VITE_SEGMENT_WRITE_KEY') || ''

// Reparent the prerendered hero shell OUTSIDE #root so createRoot doesn't
// destroy it.  The shell's hero image stays visible as the LCP element while
// React loads; the Hero component removes the shell once it has mounted.
const root = document.getElementById('root')!
const heroShell = document.getElementById('hero-shell')
const heroNav = document.getElementById('hero-shell-nav')
if (heroNav) root.before(heroNav)
if (heroShell) root.before(heroShell)

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <WalletStateProvider>
        <LazyWeb3>
          <DclThemeProvider theme={darkTheme}>
            <LocaleProvider>
              <AnalyticsProvider writeKey={segmentWriteKey}>
                <App />
              </AnalyticsProvider>
            </LocaleProvider>
          </DclThemeProvider>
        </LazyWeb3>
      </WalletStateProvider>
    </Provider>
  </StrictMode>
)
