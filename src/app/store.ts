import { configureStore } from '@reduxjs/toolkit'
import { createLazyStoreEnhancer } from '@dcl/core-web3/lazy'
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
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    }).concat(api.middleware, eventsClient.middleware, profileClient.middleware),
  devTools: import.meta.env.MODE !== 'production'
})

const injectWeb3Reducers = createLazyStoreEnhancer(store, staticReducers)

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export { store, injectWeb3Reducers, type RootState, type AppDispatch }
