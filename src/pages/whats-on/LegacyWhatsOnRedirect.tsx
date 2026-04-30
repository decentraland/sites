import { Navigate, useLocation } from 'react-router-dom'

const LegacyWhatsOnRedirect = () => {
  const location = useLocation()
  return <Navigate to={{ pathname: '/whats-on', search: location.search }} state={location.state} replace />
}

export { LegacyWhatsOnRedirect }
