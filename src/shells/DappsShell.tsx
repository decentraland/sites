import { Suspense, useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'react-redux'
import { Outlet } from 'react-router-dom'
import { CircularProgress } from 'decentraland-ui2'
import { CenteredBox } from '../App.styled'
import { ProfileModalHost } from '../components/profile/ProfileModal'
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
      [
        getOrigin('PEER_URL'),
        getOrigin('PLACES_API_URL'),
        getOrigin('STORAGE_API_URL'),
        getOrigin('WORLDS_CONTENT_SERVER_URL'),
        getOrigin('GATEKEEPER_URL')
      ].filter((v): v is string => v !== null)
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
    <HelmetProvider>
      <Provider store={store}>
        <Suspense fallback={<DappsShellFallback />}>
          <Outlet />
          {/* ProfileModalHost listens to `?profile=<address>` and renders the
              full profile experience as an overlay on top of whats-on, blog,
              social, jump, cast, storage and profile pages. Mounting it at
              shell level means any link or button in those pages can open the
              modal via useOpenProfileModal — see ProfileModalHost. */}
          <ProfileModalHost />
        </Suspense>
      </Provider>
    </HelmetProvider>
  )
}

export { DappsShell }
