/* eslint-disable import/order */
import { configureStore } from '@reduxjs/toolkit'

const signedFetchMock = jest.fn()
const resolveActiveIdentityMock = jest.fn()

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => signedFetchMock
}))

jest.mock('../utils/activeIdentity', () => ({
  resolveActiveIdentity: () => resolveActiveIdentityMock()
}))

const envMap: Record<string, string | undefined> = {
  REFERRAL_API_URL: 'https://referral-api.test'
}

jest.mock('../config/env', () => ({
  getEnv: (key: string) => envMap[key]
}))

import { referralClient } from './referralClient'
/* eslint-enable import/order */

const buildStore = () =>
  configureStore({
    reducer: { [referralClient.reducerPath]: referralClient.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(referralClient.middleware)
  })

const jsonResponse = () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })

describe('referralClient', () => {
  beforeEach(() => {
    envMap.REFERRAL_API_URL = 'https://referral-api.test'
    signedFetchMock.mockReset()
    resolveActiveIdentityMock.mockReset()
    global.fetch = jest.fn(async () => jsonResponse()) as unknown as typeof fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when wired into a store', () => {
    it('should expose its reducer under reducerPath "referralClient"', () => {
      const store = buildStore()
      const state = store.getState() as Record<string, unknown>
      expect(state).toHaveProperty('referralClient')
    })

    it('should declare reducerPath "referralClient"', () => {
      expect(referralClient.reducerPath).toBe('referralClient')
    })
  })

  describe('when a query runs without an active identity', () => {
    it('should fall back to the unsigned global fetch', async () => {
      resolveActiveIdentityMock.mockReturnValue(undefined)
      const api = referralClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          pingUnsigned: builder.query<unknown, void>({ query: () => '/referral' })
        })
      })
      const store = buildStore()

      const result = await store.dispatch(api.endpoints.pingUnsigned.initiate())

      expect(result.data).toEqual({ ok: true })
      expect(signedFetchMock).not.toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('when a query runs with an active identity', () => {
    it('should sign the request via signedFetch with that identity', async () => {
      const identity = { ephemeralIdentity: { address: '0xabc' } }
      resolveActiveIdentityMock.mockReturnValue(identity)
      signedFetchMock.mockResolvedValue(jsonResponse())

      const api = referralClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          pingSigned: builder.query<unknown, void>({ query: () => '/referral' })
        })
      })
      const store = buildStore()

      const result = await store.dispatch(api.endpoints.pingSigned.initiate())

      expect(result.data).toEqual({ ok: true })
      expect(signedFetchMock).toHaveBeenCalledTimes(1)
      const [, init] = signedFetchMock.mock.calls[0]
      expect(init.identity).toBe(identity)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('when a custom baseUrl is supplied in the query args', () => {
    it('should use it instead of the REFERRAL_API_URL env value', async () => {
      resolveActiveIdentityMock.mockReturnValue(undefined)
      const api = referralClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          customBase: builder.query<unknown, void>({
            query: () => ({ url: '/referral', baseUrl: 'https://override.test' })
          })
        })
      })
      const store = buildStore()

      await store.dispatch(api.endpoints.customBase.initiate())

      const fetchMock = global.fetch as jest.Mock
      const calledWith = fetchMock.mock.calls[0][0]
      const requestUrl = typeof calledWith === 'string' ? calledWith : (calledWith as Request).url
      expect(requestUrl).toBe('https://override.test/referral')
    })
  })

  describe('when REFERRAL_API_URL is not configured', () => {
    it('should surface a FETCH_ERROR result instead of throwing', async () => {
      envMap.REFERRAL_API_URL = undefined
      const api = referralClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          pingNoUrl: builder.query<unknown, void>({ query: () => '/referral' })
        })
      })
      const store = buildStore()

      const result = await store.dispatch(api.endpoints.pingNoUrl.initiate())

      expect((result.error as { status: string }).status).toBe('FETCH_ERROR')
    })
  })
})
