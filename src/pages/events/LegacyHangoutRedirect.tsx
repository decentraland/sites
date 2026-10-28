import { Navigate, useLocation, useParams } from 'react-router-dom'

const LegacyHangoutRedirect = () => {
  const location = useLocation()
  const { eventId } = useParams<{ eventId?: string }>()
  const pathname = eventId ? `/events/edit-event/${eventId}` : '/events/new-event'
  return <Navigate to={{ pathname, search: location.search }} state={location.state} replace />
}

export { LegacyHangoutRedirect }
