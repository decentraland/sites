import { configureStore } from '@reduxjs/toolkit'
import { api } from '../services/api'

const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    }).concat(api.middleware),
  devTools: import.meta.env.MODE !== 'production'
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export { store, type RootState, type AppDispatch }
