/* eslint-disable import/order */
import { configureStore } from '@reduxjs/toolkit'

const envMap: Record<string, string | undefined> = {
  MARKETPLACE_API_URL: 'https://marketplace-api.test/v1'
}

jest.mock('../config/env', () => ({
  getEnv: (key: string) => envMap[key]
}))

import { marketplaceClient } from './marketplaceClient'
/* eslint-enable import/order */

const buildStore = () =>
  configureStore({
    reducer: { [marketplaceClient.reducerPath]: marketplaceClient.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(marketplaceClient.middleware)
  })

const jsonResponse = () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })

describe('marketplaceClient', () => {
  beforeEach(() => {
    envMap.MARKETPLACE_API_URL = 'https://marketplace-api.test/v1'
    global.fetch = jest.fn(async () => jsonResponse()) as unknown as typeof fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when wired into a store', () => {
    it('should expose its reducer under reducerPath "marketplaceClient"', () => {
      const store = buildStore()
      const state = store.getState() as Record<string, unknown>
      expect(state).toHaveProperty('marketplaceClient')
    })

    it('should declare reducerPath "marketplaceClient"', () => {
      expect(marketplaceClient.reducerPath).toBe('marketplaceClient')
    })
  })

  describe('when a query runs against the configured base url', () => {
    it('should resolve through the default fetch base query', async () => {
      const api = marketplaceClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          ping: builder.query<unknown, void>({ query: () => '/items' })
        })
      })
      const store = buildStore()

      const result = await store.dispatch(api.endpoints.ping.initiate())

      expect(result.data).toEqual({ ok: true })
      const fetchMock = global.fetch as jest.Mock
      const calledWith = fetchMock.mock.calls[0][0]
      const requestUrl = typeof calledWith === 'string' ? calledWith : (calledWith as Request).url
      expect(requestUrl).toBe('https://marketplace-api.test/v1/items')
    })
  })

  describe('when a custom baseUrl is supplied in the query args', () => {
    it('should use it instead of the MARKETPLACE_API_URL env value', async () => {
      const api = marketplaceClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          customBase: builder.query<unknown, void>({
            query: () => ({ url: '/nfts', baseUrl: 'https://override.test' })
          })
        })
      })
      const store = buildStore()

      await store.dispatch(api.endpoints.customBase.initiate())

      const fetchMock = global.fetch as jest.Mock
      const calledWith = fetchMock.mock.calls[0][0]
      const requestUrl = typeof calledWith === 'string' ? calledWith : (calledWith as Request).url
      expect(requestUrl).toBe('https://override.test/nfts')
    })
  })

  describe('when MARKETPLACE_API_URL is not configured', () => {
    it('should surface a FETCH_ERROR result instead of throwing', async () => {
      envMap.MARKETPLACE_API_URL = undefined
      const api = marketplaceClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          pingNoUrl: builder.query<unknown, void>({ query: () => '/items' })
        })
      })
      const store = buildStore()

      const result = await store.dispatch(api.endpoints.pingNoUrl.initiate())

      expect((result.error as { status: string }).status).toBe('FETCH_ERROR')
    })
  })
})
