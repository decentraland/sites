import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { blogReducer } from '../features/cms/cms.slice'
import { adminClient } from '../features/events/events.admin.client'
import { eventsClient } from '../features/events/events.client'
import { cast2Client } from '../services/cast2Client'
import { cmsClient } from '../services/cmsClient'
import { placesClient } from '../services/placesClient'
import { socialClient } from '../services/socialClient'
import { storageClient } from '../services/storageClient'
import { subgraphClient } from '../services/subgraphClient'
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
  [subgraphClient.reducerPath]: subgraphClient.reducer
})

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
      .prepend(createWhatsOnAdminListenerMiddleware().middleware)
      .concat(
        eventsClient.middleware,
        adminClient.middleware,
        cmsClient.middleware,
        placesClient.middleware,
        cast2Client.middleware,
        socialClient.middleware,
        storageClient.middleware,
        subgraphClient.middleware
      ),
  devTools: import.meta.env.DEV
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

const useAppDispatch = () => useDispatch<AppDispatch>()
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export { store, useAppDispatch, useAppSelector }
export type { RootState, AppDispatch }
