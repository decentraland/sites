import { Navigate, useLocation } from 'react-router-dom'

const LegacyEventRedirect = () => {
  const location = useLocation()
  return <Navigate to={{ pathname: '/jump/events', search: location.search }} replace />
}

export { LegacyEventRedirect }
