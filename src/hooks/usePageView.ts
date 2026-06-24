import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAnalytics } from '@dcl/hooks'

/**
 * Fires a Segment `page()` event for the current route, gated on Segment's lazy
 * initialization.
 *
 * `Layout` fires this automatically for routes wrapped in it, but fullscreen
 * Layout-less routes (reels, invite) bypass `Layout` and must call this
 * themselves — otherwise they lose the pageview the old Gatsby sites emitted on
 * every route change (the cause of the post-migration invite/reels data gaps).
 */
function usePageView(): void {
  const location = useLocation()
  const { isInitialized, page } = useAnalytics()

  useEffect(() => {
    if (!isInitialized) return
    page(location.pathname)
  }, [isInitialized, location.pathname, page])
}

export { usePageView }
