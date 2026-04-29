import { Navigate, useLocation, useParams } from 'react-router-dom'

const LegacyHangoutRedirect = () => {
  const location = useLocation()
  const { eventId } = useParams<{ eventId?: string }>()
  const pathname = eventId ? `/whats-on/edit-hangout/${eventId}` : '/whats-on/new-hangout'
  return <Navigate to={{ pathname, search: location.search }} state={location.state} replace />
}

export { LegacyHangoutRedirect }
