import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'

// Resolves `/profile` and `/profile/me/:tab?` to the signed-in user's address.
// Unauthenticated visitors are bounced to the global SSO with a redirect param
// so they come back to the same path after signing in.
function ProfileMeRedirect() {
  const { tab } = useParams<{ tab?: string }>()
  const { address, hasValidIdentity } = useAuthIdentity()
  const location = useLocation()

  if (!hasValidIdentity || !address) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/sign-in?redirect=${redirect}`} replace />
  }

  const tabSegment = tab ? `/${tab}` : ''
  return <Navigate to={`/profile/${address.toLowerCase()}${tabSegment}`} replace />
}

export { ProfileMeRedirect }
