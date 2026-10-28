import { configureStore } from '@reduxjs/toolkit'
import { accountNotificationsApi } from '../features/account-notifications/account-notifications.client'
import { adminClient } from '../features/events/events.admin.client'
import { eventsClient } from '../features/events/events.client'
import { accountNotificationsClient } from '../services/accountNotificationsClient'
import { cast2Client } from '../services/cast2Client'
import { creditsClient } from '../services/creditsClient'
import { placesClient } from '../services/placesClient'
import { referralClient } from '../services/referralClient'
import { socialClient } from '../services/socialClient'
import { storageClient } from '../services/storageClient'
import { advanceAuthSession } from '../utils/authSession'
import { clearPrivateCaches } from './privateCaches'
import type { AppDispatch } from './store'

const mockSignedFetch = jest.fn()
jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory:
    () =>
    (...args: unknown[]) =>
      mockSignedFetch(...args)
}))
jest.mock('../config/env', () => ({ getEnv: () => 'https://private.test' }))
jest.mock('../utils/activeIdentity', () => ({ resolveActiveIdentity: () => ({ authChain: [{ payload: '0xaaa' }] }) }))

const castApi = cast2Client.injectEndpoints({
  endpoints: builder => ({ preservedStream: builder.query<string, void>({ queryFn: () => ({ data: 'stream-token' }) }) })
})
const placesApi = placesClient.injectEndpoints({
  endpoints: builder => ({ preservedPlace: builder.query<string, void>({ queryFn: () => ({ data: 'public-place' }) }) })
})
const buildStore = () =>
  configureStore({
    reducer: {
      [accountNotificationsClient.reducerPath]: accountNotificationsClient.reducer,
      [referralClient.reducerPath]: referralClient.reducer,
      [creditsClient.reducerPath]: creditsClient.reducer,
      [socialClient.reducerPath]: socialClient.reducer,
      [eventsClient.reducerPath]: eventsClient.reducer,
      [adminClient.reducerPath]: adminClient.reducer,
      [storageClient.reducerPath]: storageClient.reducer,
      [cast2Client.reducerPath]: cast2Client.reducer,
      [placesClient.reducerPath]: placesClient.reducer
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(
        accountNotificationsClient.middleware,
        referralClient.middleware,
        creditsClient.middleware,
        socialClient.middleware,
        eventsClient.middleware,
        adminClient.middleware,
        storageClient.middleware,
        cast2Client.middleware,
        placesClient.middleware
      )
  })
const response = () =>
  new Response(JSON.stringify({ email: 'alice@example.com', details: {} }), { headers: { 'Content-Type': 'application/json' } })

describe('when private caches are cleared on an account transition', () => {
  let store: ReturnType<typeof buildStore>
  let finish: (response: Response) => void
  let query: ReturnType<ReturnType<typeof accountNotificationsApi.endpoints.getSubscription.initiate>>
  let mutation: ReturnType<ReturnType<typeof accountNotificationsApi.endpoints.setEmail.initiate>>

  beforeEach(async () => {
    store = buildStore()
    await store.dispatch(castApi.endpoints.preservedStream.initiate()).unwrap()
    await store.dispatch(placesApi.endpoints.preservedPlace.initiate()).unwrap()
  })

  afterEach(() => {
    clearPrivateCaches(store.dispatch as AppDispatch)
    store.dispatch(cast2Client.util.resetApiState())
    store.dispatch(placesClient.util.resetApiState())
    jest.resetAllMocks()
  })

  it('should remove private cached data and preserve anonymous streaming and public places', async () => {
    mockSignedFetch.mockResolvedValueOnce(response())
    await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xaaa' })).unwrap()
    advanceAuthSession()
    clearPrivateCaches(store.dispatch as AppDispatch)
    expect(accountNotificationsApi.endpoints.getSubscription.select({ address: '0xaaa' })(store.getState()).data).toBeUndefined()
    expect(castApi.endpoints.preservedStream.select()(store.getState()).data).toBe('stream-token')
    expect(placesApi.endpoints.preservedPlace.select()(store.getState()).data).toBe('public-place')
  })

  it('should abort running queries and ignore a response that completes after cleanup', async () => {
    mockSignedFetch.mockReturnValueOnce(
      new Promise<Response>(resolve => {
        finish = resolve
      })
    )
    query = store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xaaa' }))
    await Promise.resolve()
    await Promise.resolve()
    advanceAuthSession()
    clearPrivateCaches(store.dispatch as AppDispatch)
    await query
    expect((mockSignedFetch.mock.calls[0][0] as Request).signal.aborted).toBe(true)
    finish(response())
    await Promise.resolve()
    expect(accountNotificationsApi.endpoints.getSubscription.select({ address: '0xaaa' })(store.getState()).data).toBeUndefined()
  })

  it('should abort running mutations as well as clearing their state', async () => {
    mockSignedFetch.mockReturnValueOnce(
      new Promise<Response>(resolve => {
        finish = resolve
      })
    )
    mutation = store.dispatch(accountNotificationsApi.endpoints.setEmail.initiate({ address: '0xaaa', email: 'alice@example.com' }))
    await Promise.resolve()
    await Promise.resolve()
    advanceAuthSession()
    clearPrivateCaches(store.dispatch as AppDispatch)
    await expect(mutation.unwrap()).rejects.toMatchObject({ name: 'AbortError' })
    finish(response())
    await mutation
    expect(store.dispatch(accountNotificationsClient.util.getRunningMutationsThunk())).toHaveLength(0)
  })
})
