import { useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { type LegacyRedirectOrigin, useLegacyRedirectTracking } from '../hooks/useLegacyRedirectTracking'

interface Props {
  /** The old section prefix, without a trailing slash: `/whats-on`. */
  from: string
  /** The new section prefix, without a trailing slash: `/events`. */
  to: string
  origin: LegacyRedirectOrigin
}

/**
 * Keeps a renamed section's old URLs working. What's On became Events at
 * `/events` and Discover became Places at `/places`, so every shared link,
 * bookmark and indexed page under the old prefixes has to keep landing on the
 * same content.
 *
 * The subpath and the query string are carried over, which is what separates
 * this from the fixed-destination redirects the standalone events and places
 * sites needed: `/whats-on/admin/users?tab=x` has to reach
 * `/events/admin/users?tab=x`, not the section root.
 *
 * It reuses the legacy-redirect Segment events rather than adding new ones, so
 * the same dashboard that tracks the old standalone-site traffic also shows
 * when these paths go quiet and can be dropped.
 */
const RenamedSectionRedirect = ({ from, to, origin }: Props) => {
  const location = useLocation()
  const pathname = `${to}${location.pathname.slice(from.length)}`
  const preservedParams = useMemo(() => Object.fromEntries(new URLSearchParams(location.search)), [location.search])
  const ready = useLegacyRedirectTracking({
    origin,
    source: `${location.pathname}${location.search}`,
    destination: `${pathname}${location.search}`,
    preservedParams
  })

  if (!ready) return null

  return <Navigate to={{ pathname, search: location.search }} state={location.state} replace />
}

export { RenamedSectionRedirect }
