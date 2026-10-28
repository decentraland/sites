import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useModalProfileNavigation } from './ModalProfileNavigation'
import { PROFILE_MODAL_QUERY_KEY } from './ProfileModal.constants'
import { useProfileModalHostAvailable } from './ProfileModalHostContext'

/**
 * Returns a function to open the profile for a given address.
 *
 * Three cases, in priority order:
 * 1. Inside a `ModalProfileNavigationProvider` (e.g. already inside the event
 *    detail or photo modal) → delegate so the profile is swapped in-place, no
 *    dialog stacked on top.
 * 2. On a route with a `ProfileModalHost` (anything inside `DappsShell`) → add
 *    `?profile=<address>` to the URL; the host opens the overlay.
 * 3. On a lightweight, Layout-less route with no host (e.g. the standalone reels
 *    viewer) → navigate to the full `/profile/<address>` page. Writing
 *    `?profile=` there would be a no-op because nothing renders the overlay.
 */
function useOpenProfileModal(): (address: string) => void {
  const navigate = useNavigate()
  const location = useLocation()
  const inModalNavigation = useModalProfileNavigation()
  const hostAvailable = useProfileModalHostAvailable()
  return useCallback(
    (address: string) => {
      if (!address) return
      if (inModalNavigation) {
        inModalNavigation(address)
        return
      }
      if (!hostAvailable) {
        navigate(`/profile/${address.toLowerCase()}`)
        return
      }
      const params = new URLSearchParams(location.search)
      params.set(PROFILE_MODAL_QUERY_KEY, address.toLowerCase())
      navigate({ pathname: location.pathname, search: `?${params.toString()}` })
    },
    [inModalNavigation, hostAvailable, location.pathname, location.search, navigate]
  )
}

export { useOpenProfileModal }
