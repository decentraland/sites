import { useAuthIdentity } from '../hooks/useAuthIdentity'
import { RemoteLoader } from './RemoteLoader'

function ExploreRemoteWithIdentity() {
  const { identity, address } = useAuthIdentity()
  return <RemoteLoader name="explore" identity={identity} address={address} />
}

export { ExploreRemoteWithIdentity }
