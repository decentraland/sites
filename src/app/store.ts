import { configureStore } from '@reduxjs/toolkit'
import { eventsClient } from '../features/events/events.client'
import { profileClient } from '../features/profile/profile.client'
import { api } from '../services/api'

const staticReducers = {
  [api.reducerPath]: api.reducer,
  [eventsClient.reducerPath]: eventsClient.reducer,
  [profileClient.reducerPath]: profileClient.reducer
}

const store = configureStore({
  reducer: staticReducers,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(api.middleware, eventsClient.middleware, profileClient.middleware),
  devTools: import.meta.env.MODE !== 'production'
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export { store, staticReducers, type RootState, type AppDispatch }
