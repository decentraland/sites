import { Suspense, useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { CircularProgress } from 'decentraland-ui2'
import { CenteredBox } from '../App.styled'
import { getEnv } from '../config/env'
import { store } from './store'

function DappsShellFallback() {
  return (
    <CenteredBox>
      <CircularProgress color="inherit" />
    </CenteredBox>
  )
}

function getOrigin(envKey: string): string | null {
  const value = getEnv(envKey)
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function usePreconnectHints() {
  useEffect(() => {
    // Origins that differ per env (zone/today/org). Injected at runtime so
    // the correct host is hit without wasting TCP/TLS on homepage visitors.
    const origins = new Set(
      [getOrigin('PEER_URL'), getOrigin('PLACES_API_URL'), getOrigin('GATEKEEPER_URL'), getOrigin('WORLDS_CONTENT_URL')].filter(
        (v): v is string => v !== null
      )
    )
    const links: HTMLLinkElement[] = []
    origins.forEach(origin => {
      // Skip if index.html (or a prior mount) already preconnected this origin.
      if (document.head.querySelector(`link[rel="preconnect"][href="${CSS.escape(origin)}"]`)) return
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = origin
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
      links.push(link)
    })
    return () => {
      links.forEach(link => link.remove())
    }
  }, [])
}

function DappsShell() {
  usePreconnectHints()

  return (
    <Provider store={store}>
      <HelmetProvider>
        <Suspense fallback={<DappsShellFallback />}>
          <Outlet />
        </Suspense>
      </HelmetProvider>
    </Provider>
  )
}

export { DappsShell }
