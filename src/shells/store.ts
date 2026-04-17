import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import type { TypedUseSelectorHook } from 'react-redux'
import { useDispatch, useSelector } from 'react-redux'
import { blogReducer } from '../features/blog/blog.slice'
import { eventsClient } from '../features/explore-events/events.client'
import { algoliaClient, cmsClient } from '../services/blogClient'

const blogPersistConfig = {
  key: 'blog',
  storage,
  whitelist: ['ids', 'entities']
}

const rootReducer = combineReducers({
  [eventsClient.reducerPath]: eventsClient.reducer,
  blog: persistReducer(blogPersistConfig, blogReducer),
  [cmsClient.reducerPath]: cmsClient.reducer,
  [algoliaClient.reducerPath]: algoliaClient.reducer
})

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
      }
    }).concat(eventsClient.middleware, cmsClient.middleware, algoliaClient.middleware),
  devTools: import.meta.env.DEV
})

const persistor = persistStore(store)

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

const useAppDispatch = () => useDispatch<AppDispatch>()
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export { store, persistor, useAppDispatch, useAppSelector }
export type { RootState, AppDispatch }
