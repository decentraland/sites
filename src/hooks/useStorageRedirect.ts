import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { redirectToAuth } from '../utils/authRedirect'
import { useAuthIdentity } from './useAuthIdentity'
import { useStorageScope } from './useStorageScope'

interface UseStorageRedirectResult {
  isReady: boolean
}

function useStorageRedirect(): UseStorageRedirectResult {
  const { hasValidIdentity } = useAuthIdentity()
  const { pathname } = useLocation()
  const { realm, position } = useStorageScope()

  useEffect(() => {
    // NOTE: storage endpoints require a SIGNED request (ADR-44). An address alone
    // is not enough — without a valid ephemeral identity, `setEnv` falls back to
    // an unsigned fetch and the server replies 400 "Invalid Auth Chain".
    // Issue #505 surfaced a user stuck in that half-signed-in state: address in
    // localStorage but identity expired. Redirecting to /auth here forces a
    // fresh sign-in instead of letting the page emit silent failures.
    if (hasValidIdentity) return
    const queryParams: Record<string, string> = {}
    if (realm) queryParams.realm = realm
    if (position) queryParams.position = position
    redirectToAuth(pathname, Object.keys(queryParams).length > 0 ? queryParams : undefined)
  }, [hasValidIdentity, pathname, realm, position])

  return { isReady: hasValidIdentity }
}

export { useStorageRedirect }
