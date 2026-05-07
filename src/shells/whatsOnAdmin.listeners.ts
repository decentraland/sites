import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { adminClient } from '../features/experiences/events/admin'
import { eventsClient } from '../features/experiences/events/events.client'

function createWhatsOnAdminListenerMiddleware() {
  const listenerMiddleware = createListenerMiddleware()

  listenerMiddleware.startListening({
    matcher: isAnyOf(eventsClient.endpoints.createEvent.matchFulfilled, eventsClient.endpoints.updateEvent.matchFulfilled),
    effect: (_action, listenerApi) => {
      listenerApi.dispatch(adminClient.util.invalidateTags(['PendingEvents']))
    }
  })

  return listenerMiddleware
}

export { createWhatsOnAdminListenerMiddleware }
