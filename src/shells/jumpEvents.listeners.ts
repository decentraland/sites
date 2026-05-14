import { createListenerMiddleware } from '@reduxjs/toolkit'
import { eventsClient } from '../features/events/events.client'
import { placesClient } from '../services/placesClient'

// `toggleAttendee` lives on `eventsClient` and invalidates the `Events` tag
// there, but `/jump/events` reads from `placesClient.getJumpEvent(s)`. RTK
// Query tags are scoped per-API, so the bridge has to be wired manually —
// keeping it in middleware (instead of a per-component callback) means future
// callers of `useRemindMe` can't silently regress the bug by forgetting it.
function createJumpEventsListenerMiddleware() {
  const listenerMiddleware = createListenerMiddleware()

  listenerMiddleware.startListening({
    matcher: eventsClient.endpoints.toggleAttendee.matchFulfilled,
    effect: (_action, listenerApi) => {
      listenerApi.dispatch(placesClient.util.invalidateTags(['JumpEvent']))
    }
  })

  return listenerMiddleware
}

export { createJumpEventsListenerMiddleware }
