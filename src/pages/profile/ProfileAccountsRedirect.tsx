import { Navigate, useParams } from 'react-router-dom'

// Legacy alias for the absorbed `decentraland/profile` dapp: the old surface
// served profiles at `/profile/accounts/<address>`. Now we route to the
// canonical `/profile/<address>`. Address is lowercased on the way in.
function ProfileAccountsRedirect() {
  const { address, tab } = useParams<{ address: string; tab?: string }>()
  if (!address) return <Navigate to="/profile" replace />
  const tabSegment = tab ? `/${tab}` : ''
  return <Navigate to={`/profile/${address.toLowerCase()}${tabSegment}`} replace />
}

export { ProfileAccountsRedirect }
