import { type Reducer, combineReducers, configureStore } from '@reduxjs/toolkit'
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

let web3Injected = false

function injectWeb3Reducers(reducers: Record<string, Reducer>) {
  if (web3Injected) return
  web3Injected = true

  store.replaceReducer(
    combineReducers({
      ...staticReducers,
      ...reducers
    })
  )
}

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export { injectWeb3Reducers, store, type AppDispatch, type RootState }
