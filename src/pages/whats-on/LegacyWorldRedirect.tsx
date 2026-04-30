import { Navigate, useLocation } from 'react-router-dom'

const buildSearch = (rawSearch: string): string => {
  const params = new URLSearchParams(rawSearch)
  const name = params.get('name')
  if (name) {
    params.delete('name')
    params.set('world', name)
  }
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

const LegacyWorldRedirect = () => {
  const location = useLocation()
  return <Navigate to={{ pathname: '/whats-on', search: buildSearch(location.search) }} state={location.state} replace />
}

export { LegacyWorldRedirect }
