import { configureStore } from '@reduxjs/toolkit'
import { marketplaceClient } from './marketplaceClient'

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => async () => new Response('{}', { status: 200 })
}))

jest.mock('../config/env', () => ({
  getEnv: () => 'https://marketplace-api.test/v1'
}))

describe('marketplaceClient', () => {
  describe('when wired into a store', () => {
    it('should expose its reducer under reducerPath "marketplaceClient"', () => {
      const store = configureStore({
        reducer: { [marketplaceClient.reducerPath]: marketplaceClient.reducer },
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(marketplaceClient.middleware)
      })
      const state = store.getState() as Record<string, unknown>
      expect(state).toHaveProperty('marketplaceClient')
    })

    it('should declare reducerPath "marketplaceClient"', () => {
      expect(marketplaceClient.reducerPath).toBe('marketplaceClient')
    })
  })
})
