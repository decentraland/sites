import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { createLazyStoreEnhancer } from '@dcl/core-web3/lazy'
import { blogReducer } from '../features/cms/cms.slice'
import { adminClient } from '../features/events/events.admin.client'
import { eventsClient } from '../features/events/events.client'
import { accountNotificationsClient } from '../services/accountNotificationsClient'
import { cast2Client } from '../services/cast2Client'
import { cmsClient } from '../services/cmsClient'
import { creditsClient } from '../services/creditsClient'
import { marketplaceClient } from '../services/marketplaceClient'
import { placesClient } from '../services/placesClient'
import { referralClient } from '../services/referralClient'
import { socialClient } from '../services/socialClient'
import { storageClient } from '../services/storageClient'
import { subgraphClient } from '../services/subgraphClient'
import { createJumpEventsListenerMiddleware } from './jumpEvents.listeners'
import { createWhatsOnAdminListenerMiddleware } from './whatsOnAdmin.listeners'

// Kept as a map (not the combined reducer) so the BlockchainShell's lazy enhancer can rebuild the
// root reducer with the core-web3 slices appended while preserving every static reducer. Left
// un-annotated so TS infers the precise per-slice state the RTK Query middleware type-checks against.
const staticReducers = {
  [eventsClient.reducerPath]: eventsClient.reducer,
  [adminClient.reducerPath]: adminClient.reducer,
  blog: blogReducer,
  [cmsClient.reducerPath]: cmsClient.reducer,
  [placesClient.reducerPath]: placesClient.reducer,
  [cast2Client.reducerPath]: cast2Client.reducer,
  [socialClient.reducerPath]: socialClient.reducer,
  [storageClient.reducerPath]: storageClient.reducer,
  [subgraphClient.reducerPath]: subgraphClient.reducer,
  [marketplaceClient.reducerPath]: marketplaceClient.reducer,
  [referralClient.reducerPath]: referralClient.reducer,
  [accountNotificationsClient.reducerPath]: accountNotificationsClient.reducer,
  [creditsClient.reducerPath]: creditsClient.reducer
}

const store = configureStore({
  reducer: combineReducers(staticReducers),
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
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
        marketplaceClient.middleware,
        referralClient.middleware,
        accountNotificationsClient.middleware,
        creditsClient.middleware
      ),
  devTools: import.meta.env.DEV
})

/**
 * Lazily injects core-web3's `wallet` / `network` / `transactions` slices into the store once the
 * BlockchainShell's `Web3LazyProvider` has loaded the (heavy) Web3 bundle. Additive — every static
 * reducer above is preserved. No-op after the first call. Only `BlockchainShell` should invoke it.
 */
const injectWeb3Reducers = createLazyStoreEnhancer(store, staticReducers)

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

const useAppDispatch = () => useDispatch<AppDispatch>()
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export { injectWeb3Reducers, store, useAppDispatch, useAppSelector }
export type { RootState, AppDispatch }
