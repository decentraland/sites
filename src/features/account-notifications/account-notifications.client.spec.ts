import { configureStore } from '@reduxjs/toolkit'
import { accountNotificationsClient } from '../../services/accountNotificationsClient'
import { accountNotificationsApi } from './account-notifications.client'
import type { SubscriptionResponse } from './account-notifications.types'

const mockSignedFetch = jest.fn()
jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory:
    () =>
    (...args: unknown[]) =>
      mockSignedFetch(...args)
}))

jest.mock('../../config/env', () => ({
  getEnv: () => 'https://notifications.test'
}))

const mockResolveActiveIdentity = jest.fn()
jest.mock('../../utils/activeIdentity', () => ({
  resolveActiveIdentity: () => mockResolveActiveIdentity()
}))

const buildSubscription = (override: Partial<SubscriptionResponse> = {}): SubscriptionResponse => ({
  address: '0xabc',
  email: 'user@decentraland.org',
  details: {
    ignore_all_email: false,
    ignore_all_in_app: false,
    message_type: {}
  } as SubscriptionResponse['details'],
  ...override
})

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

// `fetchBaseQuery` may call fetch with either a URL string or a Request object (for bodied
// requests). Normalise so assertions don't depend on which form was used.
const callUrl = (call: unknown[]): string => {
  const input = call[0]
  return typeof input === 'string' ? input : (input as Request).url
}
const callMethod = (call: unknown[]): string | undefined => {
  const input = call[0]
  if (input instanceof Request) return input.method
  return (call[1] as { method?: string } | undefined)?.method
}
// Find a fetch invocation by HTTP method + URL, so assertions don't depend on call ordering
// (RTK Query may fire extra background refetches).
const findCall = (spy: jest.SpyInstance, method: string, url: string): unknown[] | undefined =>
  spy.mock.calls.find(call => callMethod(call) === method && callUrl(call) === url)

const createTestStore = () =>
  configureStore({
    reducer: { [accountNotificationsClient.reducerPath]: accountNotificationsClient.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(accountNotificationsClient.middleware)
  })

describe('accountNotificationsApi', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch')
    mockResolveActiveIdentity.mockReturnValue(undefined)
    mockSignedFetch.mockReset()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when getSubscription is called', () => {
    it('should GET /subscription and return the payload', async () => {
      fetchSpy.mockResolvedValueOnce(jsonResponse(buildSubscription()))
      const store = createTestStore()

      const result = await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate())

      expect(findCall(fetchSpy, 'GET', 'https://notifications.test/subscription')).toBeDefined()
      expect((result.data as SubscriptionResponse).email).toBe('user@decentraland.org')
    })

    it('should sign the request when an identity is available', async () => {
      mockResolveActiveIdentity.mockReturnValue({ authChain: [] })
      mockSignedFetch.mockResolvedValueOnce(jsonResponse(buildSubscription()))
      const store = createTestStore()

      await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate())

      expect(mockSignedFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('when updateSubscription succeeds', () => {
    it('should PUT /subscription and reconcile the cache with the server details', async () => {
      const updatedDetails = {
        ignore_all_email: false,
        ignore_all_in_app: false,
        message_type: { tip_received: { email: true, in_app: true } }
      } as SubscriptionResponse['details']

      fetchSpy.mockImplementation((input: Request | string) => {
        const method = input instanceof Request ? input.method : 'GET'
        return Promise.resolve(
          method === 'PUT' ? jsonResponse(buildSubscription({ details: updatedDetails })) : jsonResponse(buildSubscription())
        )
      })

      const store = createTestStore()
      await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate())
      await store.dispatch(accountNotificationsApi.endpoints.updateSubscription.initiate(updatedDetails))

      const putCall = findCall(fetchSpy, 'PUT', 'https://notifications.test/subscription')
      expect(putCall).toBeDefined()

      const cached = accountNotificationsApi.endpoints.getSubscription.select()(store.getState() as never)
      expect(cached.data?.details).toEqual(updatedDetails)
    })
  })

  describe('when updateSubscription fails', () => {
    it('should roll the optimistic cache update back to the previous details', async () => {
      const original = buildSubscription()
      fetchSpy.mockImplementation((input: Request | string) => {
        const method = input instanceof Request ? input.method : 'GET'
        return Promise.resolve(method === 'PUT' ? jsonResponse('nope', 500) : jsonResponse(original))
      })

      const store = createTestStore()
      await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate())
      await store.dispatch(
        accountNotificationsApi.endpoints.updateSubscription.initiate({
          ignore_all_email: true,
          ignore_all_in_app: false,
          message_type: {}
        } as SubscriptionResponse['details'])
      )

      const cached = accountNotificationsApi.endpoints.getSubscription.select()(store.getState() as never)
      expect(cached.data?.details).toEqual(original.details)
    })
  })

  describe('when setEmail succeeds', () => {
    it('should PUT /set-email and write the address as unconfirmedEmail in the cache', async () => {
      fetchSpy.mockImplementation((input: Request | string) => {
        const method = input instanceof Request ? input.method : 'GET'
        return Promise.resolve(method === 'PUT' ? jsonResponse({}) : jsonResponse(buildSubscription({ email: '' })))
      })

      const store = createTestStore()
      await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate())
      await store.dispatch(accountNotificationsApi.endpoints.setEmail.initiate({ email: 'new@decentraland.org' }))

      const putCall = findCall(fetchSpy, 'PUT', 'https://notifications.test/set-email')
      expect(putCall).toBeDefined()

      const cached = accountNotificationsApi.endpoints.getSubscription.select()(store.getState() as never)
      expect(cached.data?.unconfirmedEmail).toBe('new@decentraland.org')
    })
  })
})
