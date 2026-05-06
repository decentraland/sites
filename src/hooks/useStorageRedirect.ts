import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { redirectToAuth } from '../utils/authRedirect'
import { useAuthIdentity } from './useAuthIdentity'
import { useStorageScope } from './useStorageScope'

interface UseStorageRedirectResult {
  isReady: boolean
}

function useStorageRedirect(): UseStorageRedirectResult {
  const { hasValidIdentity, address } = useAuthIdentity()
  const { pathname } = useLocation()
  const { realm, position } = useStorageScope()

  useEffect(() => {
    if (hasValidIdentity || address) return
    const queryParams: Record<string, string> = {}
    if (realm) queryParams.realm = realm
    if (position) queryParams.position = position
    redirectToAuth(pathname, Object.keys(queryParams).length > 0 ? queryParams : undefined)
  }, [hasValidIdentity, address, pathname, realm, position])

  return { isReady: hasValidIdentity }
}

export { useStorageRedirect }
