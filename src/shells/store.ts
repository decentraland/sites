import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { blogReducer } from '../features/cms/cms.slice'
import { adminClient } from '../features/events/events.admin.client'
import { eventsClient } from '../features/events/events.client'
import { cast2Client } from '../services/cast2Client'
import { cmsClient } from '../services/cmsClient'
import { gatekeeperClient } from '../services/gatekeeperClient'
import { placesClient } from '../services/placesClient'
import { socialClient } from '../services/socialClient'
import { storageClient } from '../services/storageClient'
import { subgraphClient } from '../services/subgraphClient'
import { createJumpEventsListenerMiddleware } from './jumpEvents.listeners'
import { createWhatsOnAdminListenerMiddleware } from './whatsOnAdmin.listeners'

const rootReducer = combineReducers({
  [eventsClient.reducerPath]: eventsClient.reducer,
  [adminClient.reducerPath]: adminClient.reducer,
  blog: blogReducer,
  [cmsClient.reducerPath]: cmsClient.reducer,
  [placesClient.reducerPath]: placesClient.reducer,
  [cast2Client.reducerPath]: cast2Client.reducer,
  [socialClient.reducerPath]: socialClient.reducer,
  [storageClient.reducerPath]: storageClient.reducer,
  [subgraphClient.reducerPath]: subgraphClient.reducer,
  [gatekeeperClient.reducerPath]: gatekeeperClient.reducer
})

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Signed endpoints (storage, events, cast) take the `AuthIdentity` as a
        // query/mutation arg so the baseQuery can sign the request. Its
        // `expiration` is a `Date`, and RTK Query persists query args under
        // `queries.<key>.originalArgs`, so the dev serializability check flags
        // it. Identity is already excluded from every cache key (see each
        // endpoint's `serializeQueryArgs`) and never drives rendering, so we
        // exclude the `originalArgs.identity` subtree from the state check
        // rather than reshape every signed endpoint's args. The `meta.arg`
        // action path is ignored by RTK's defaults already.
        ignoredPaths: [/\.originalArgs\.identity$/]
      }
    })
      .prepend(createWhatsOnAdminListenerMiddleware().middleware, createJumpEventsListenerMiddleware().middleware)
      .concat(
        eventsClient.middleware,
        adminClient.middleware,
        cmsClient.middleware,
        placesClient.middleware,
        cast2Client.middleware,
        socialClient.middleware,
        storageClient.middleware,
        subgraphClient.middleware,
        gatekeeperClient.middleware
      ),
  devTools: import.meta.env.DEV
})

// Wire up the global `focus` + `online` listeners so any query that opts into
// `refetchOnFocus` / `refetchOnReconnect` actually fires. Without this call,
// those flags are silently ignored. Used by the /discover LIVE page to keep
// hot-scenes / live-worlds data fresh when the user returns to the tab.
setupListeners(store.dispatch)

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

const useAppDispatch = () => useDispatch<AppDispatch>()
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export { store, useAppDispatch, useAppSelector }
export type { RootState, AppDispatch }
