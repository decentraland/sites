import { useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { type LegacyRedirectOrigin, useLegacyRedirectTracking } from '../../hooks/useLegacyRedirectTracking'

interface Props {
  origin: LegacyRedirectOrigin
}

const LegacyWhatsOnRedirect = ({ origin }: Props) => {
  const location = useLocation()
  const preservedParams = useMemo(() => Object.fromEntries(new URLSearchParams(location.search)), [location.search])
  const ready = useLegacyRedirectTracking({
    origin,
    source: `${location.pathname}${location.search}`,
    destination: `/events${location.search}`,
    preservedParams
  })
  if (!ready) return null
  return <Navigate to={{ pathname: '/events', search: location.search }} state={location.state} replace />
}

export { LegacyWhatsOnRedirect }
