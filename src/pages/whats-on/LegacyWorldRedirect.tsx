import { useMemo } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useLegacyRedirectTracking } from '../../hooks/useLegacyRedirectTracking'

const buildSearch = (rawSearch: string): { search: string; preservedParams: Record<string, string> } => {
  const params = new URLSearchParams(rawSearch)
  const name = params.get('name')
  if (name) {
    params.delete('name')
    params.set('world', name)
  }
  const serialized = params.toString()
  return {
    search: serialized ? `?${serialized}` : '',
    preservedParams: Object.fromEntries(params)
  }
}

const LegacyWorldRedirect = () => {
  const location = useLocation()
  const { search, preservedParams } = useMemo(() => buildSearch(location.search), [location.search])
  const ready = useLegacyRedirectTracking({
    origin: 'places',
    source: `${location.pathname}${location.search}`,
    destination: `/whats-on${search}`,
    preservedParams
  })
  if (!ready) return null
  return <Navigate to={{ pathname: '/whats-on', search }} state={location.state} replace />
}

export { LegacyWorldRedirect }
