import { configureStore } from '@reduxjs/toolkit'
import { networkReducer, transactionsReducer, walletReducer } from '@dcl/core-web3'
import { profileClient } from '../features/profile/profile.client'
import { api } from '../services/api'

const store = configureStore({
  reducer: {
    network: networkReducer,
    transactions: transactionsReducer,
    wallet: walletReducer,
    [api.reducerPath]: api.reducer,
    [profileClient.reducerPath]: profileClient.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    }).concat(api.middleware, profileClient.middleware),
  devTools: import.meta.env.MODE !== 'production'
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export { store, type RootState, type AppDispatch }
