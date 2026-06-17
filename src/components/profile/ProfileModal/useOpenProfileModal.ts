import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useModalProfileNavigation } from './ModalProfileNavigation'
import { PROFILE_MODAL_QUERY_KEY } from './ProfileModal.constants'

/**
 * Returns a function to open the profile for a given address.
 *
 * When invoked inside a `ModalProfileNavigationProvider` (e.g. when the user is
 * already inside the event detail modal), it delegates to the host modal so the
 * profile can be swapped in-place — no separate dialog on top. Outside any
 * provider it falls back to adding `?profile=<address>` to the URL, which is
 * picked up by `ProfileModalHost` and opens a standalone modal.
 */
function useOpenProfileModal(): (address: string) => void {
  const navigate = useNavigate()
  const location = useLocation()
  const inModalNavigation = useModalProfileNavigation()
  return useCallback(
    (address: string) => {
      if (!address) return
      if (inModalNavigation) {
        inModalNavigation(address)
        return
      }
      const params = new URLSearchParams(location.search)
      params.set(PROFILE_MODAL_QUERY_KEY, address.toLowerCase())
      navigate({ pathname: location.pathname, search: `?${params.toString()}` })
    },
    [inModalNavigation, location.pathname, location.search, navigate]
  )
}

export { useOpenProfileModal }
