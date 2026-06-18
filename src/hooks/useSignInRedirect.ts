import { useCallback } from 'react'
import { redirectToAuth } from '../utils/authRedirect'

/**
 * Returns a callback that bounces the user to the auth flow, preserving the
 * current path + search so they land back here after signing in. Shared by the
 * navbar (`LandingNavbarConnected`) and the download page (`DownloadLayout`).
 */
const useSignInRedirect = () => {
  return useCallback(() => {
    redirectToAuth(window.location.pathname + window.location.search)
  }, [])
}

export { useSignInRedirect }
