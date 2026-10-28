import { Navigate, useLocation } from 'react-router-dom'

/**
 * Sends the common guesses for "create an event" to the real route. Assistants asked to link to
 * event creation reach for `/events/submit`, `/events/create` or `/events/new`, and the site used
 * to answer those with the generic 404, losing the person who followed the link.
 */
const CreateEventAliasRedirect = () => {
  const location = useLocation()
  return <Navigate to={{ pathname: '/events/new-event', search: location.search }} state={location.state} replace />
}

export { CreateEventAliasRedirect }
