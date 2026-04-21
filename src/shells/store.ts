import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { blogReducer } from '../features/blog/blog.slice'
import { eventsClient } from '../features/whats-on-events/events.client'
import { algoliaClient, cmsClient } from '../services/blogClient'
import { placesClient } from '../services/placesClient'

const rootReducer = combineReducers({
  [eventsClient.reducerPath]: eventsClient.reducer,
  blog: blogReducer,
  [cmsClient.reducerPath]: cmsClient.reducer,
  [algoliaClient.reducerPath]: algoliaClient.reducer,
  [placesClient.reducerPath]: placesClient.reducer
})

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(eventsClient.middleware, cmsClient.middleware, algoliaClient.middleware, placesClient.middleware),
  devTools: import.meta.env.DEV
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

const useAppDispatch = () => useDispatch<AppDispatch>()
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export { store, useAppDispatch, useAppSelector }
export type { RootState, AppDispatch }
