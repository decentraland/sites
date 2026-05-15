import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ProfileModal } from './ProfileModal'
import { PROFILE_MODAL_QUERY_KEY as QUERY_KEY } from './ProfileModal.constants'

function ProfileModalHost() {
  const location = useLocation()
  const navigate = useNavigate()
  const address = useMemo(() => new URLSearchParams(location.search).get(QUERY_KEY), [location.search])

  const handleClose = useCallback(() => {
    const next = new URLSearchParams(location.search)
    next.delete(QUERY_KEY)
    const search = next.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: false })
  }, [location.pathname, location.search, navigate])

  if (!address) return null
  return <ProfileModal address={address} open onClose={handleClose} />
}

export { ProfileModalHost }
export { PROFILE_MODAL_QUERY_KEY } from './ProfileModal.constants'
