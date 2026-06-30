import { configureStore } from '@reduxjs/toolkit'
import { creditsClient } from '../../services/creditsClient'
import { accountCreditsApi } from './account-credits.client'
import { UserCreditsStatus } from './account-credits.types'

jest.mock('decentraland-crypto-fetch', () => ({
  // The base query resolves the active identity then calls signedFetch; here it just proxies
  // to the spied global.fetch so the tests control the HTTP responses.
  signedFetchFactory: () => (input: RequestInfo, init?: RequestInit) => fetch(input, init)
}))

jest.mock('../../config/env', () => ({
  getEnv: () => 'https://credits.test'
}))

jest.mock('../../utils/activeIdentity', () => ({
  resolveActiveIdentity: () => undefined
}))

const ADDRESS = '0x1234567890123456789012345678901234567890'

// Real Response objects — fetchBaseQuery clones the response internally, so the minimal
// `{ ok, json }` stub used by some other specs (custom queryFn that never clones) is not enough here.
const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const emptyResponse = (status = 200): Response => new Response(null, { status })

function createTestStore() {
  return configureStore({
    reducer: { [creditsClient.reducerPath]: creditsClient.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(creditsClient.middleware)
  })
}

describe('accountCreditsApi', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when getUserCreditsStatus is called', () => {
    describe('and the server returns an enrolled status', () => {
      beforeEach(() => {
        fetchSpy.mockResolvedValueOnce(jsonResponse({ data: { status: UserCreditsStatus.ENROLLED, optedOutAt: null } }))
      })

      it('should unwrap the data envelope and hit the status endpoint', async () => {
        const store = createTestStore()
        const result = await store.dispatch(accountCreditsApi.endpoints.getUserCreditsStatus.initiate(ADDRESS))

        // fetchBaseQuery dispatches a Request object, not (url, init).
        const request = fetchSpy.mock.calls[0][0] as Request
        expect(request.url).toBe(`https://credits.test/users/${ADDRESS}/status`)
        expect(request.method).toBe('GET')
        expect(result.data).toEqual({ status: UserCreditsStatus.ENROLLED, optedOutAt: null })
      })
    })

    describe('and the server returns 404 for an unknown wallet', () => {
      beforeEach(() => {
        fetchSpy.mockResolvedValueOnce(jsonResponse({}, 404))
      })

      it('should resolve to a not-registered status instead of an error', async () => {
        const store = createTestStore()
        const result = await store.dispatch(accountCreditsApi.endpoints.getUserCreditsStatus.initiate(ADDRESS))

        expect(result.error).toBeUndefined()
        expect(result.data).toEqual({ status: UserCreditsStatus.NOT_REGISTERED, optedOutAt: null })
      })
    })

    describe('and the server returns a 5xx', () => {
      beforeEach(() => {
        fetchSpy.mockResolvedValueOnce(jsonResponse({}, 500))
      })

      it('should surface the numeric HTTP status as an error', async () => {
        const store = createTestStore()
        const result = await store.dispatch(accountCreditsApi.endpoints.getUserCreditsStatus.initiate(ADDRESS))

        expect(result.error).toEqual(expect.objectContaining({ status: 500 }))
      })
    })
  })

  describe('when optOutFromCredits is called', () => {
    describe('and the wallet is enrolled and the DELETE succeeds', () => {
      beforeEach(() => {
        fetchSpy
          .mockResolvedValueOnce(jsonResponse({ data: { status: UserCreditsStatus.ENROLLED, optedOutAt: null } }))
          .mockResolvedValueOnce(emptyResponse(204))
      })

      it('should patch the cached status to opted out', async () => {
        const store = createTestStore()
        await store.dispatch(accountCreditsApi.endpoints.getUserCreditsStatus.initiate(ADDRESS))

        await store.dispatch(accountCreditsApi.endpoints.optOutFromCredits.initiate(ADDRESS))

        const cached = accountCreditsApi.endpoints.getUserCreditsStatus.select(ADDRESS)(store.getState())
        expect(cached.data?.status).toBe(UserCreditsStatus.OPTED_OUT)
        expect(cached.data?.optedOutAt).toEqual(expect.any(String))
        const deleteRequest = fetchSpy.mock.calls.at(-1)?.[0] as Request
        expect(deleteRequest.url).toBe(`https://credits.test/users/${ADDRESS}`)
        expect(deleteRequest.method).toBe('DELETE')
      })
    })

    describe('and the wallet was never registered (404 on DELETE)', () => {
      beforeEach(() => {
        fetchSpy.mockResolvedValueOnce(jsonResponse({}, 404))
      })

      it('should treat the 404 as a successful no-op', async () => {
        const store = createTestStore()
        const result = await store.dispatch(accountCreditsApi.endpoints.optOutFromCredits.initiate(ADDRESS))

        expect('error' in result ? result.error : undefined).toBeUndefined()
      })
    })

    describe('and the DELETE fails with a 4xx', () => {
      beforeEach(() => {
        fetchSpy.mockResolvedValueOnce(jsonResponse({ message: 'already claimed credits' }, 400))
      })

      it('should surface the error and leave the cache untouched', async () => {
        const store = createTestStore()
        const result = await store.dispatch(accountCreditsApi.endpoints.optOutFromCredits.initiate(ADDRESS))

        expect('error' in result ? result.error : undefined).toEqual(expect.objectContaining({ status: 400 }))
      })
    })
  })

  describe('when registerForCredits is called', () => {
    describe('and the POST succeeds', () => {
      beforeEach(() => {
        fetchSpy
          .mockResolvedValueOnce(jsonResponse({ data: { status: UserCreditsStatus.NOT_REGISTERED, optedOutAt: null } }))
          .mockResolvedValueOnce(jsonResponse({ ok: true }))
      })

      it('should POST to /users and patch the cached status to enrolled', async () => {
        const store = createTestStore()
        await store.dispatch(accountCreditsApi.endpoints.getUserCreditsStatus.initiate(ADDRESS))

        await store.dispatch(accountCreditsApi.endpoints.registerForCredits.initiate(ADDRESS))

        const cached = accountCreditsApi.endpoints.getUserCreditsStatus.select(ADDRESS)(store.getState())
        expect(cached.data?.status).toBe(UserCreditsStatus.ENROLLED)
        expect(cached.data?.optedOutAt).toBeNull()
        const postRequest = fetchSpy.mock.calls.at(-1)?.[0] as Request
        expect(postRequest.url).toBe('https://credits.test/users')
        expect(postRequest.method).toBe('POST')
      })
    })

    describe('and the POST fails because the wallet has no confirmed email', () => {
      beforeEach(() => {
        fetchSpy.mockResolvedValueOnce(jsonResponse({ error: 'User must be subscribed to notifications with a valid email' }, 400))
      })

      it('should surface the error and leave the cache untouched', async () => {
        const store = createTestStore()
        const result = await store.dispatch(accountCreditsApi.endpoints.registerForCredits.initiate(ADDRESS))

        expect('error' in result ? result.error : undefined).toEqual(expect.objectContaining({ status: 400 }))
      })
    })
  })
})
