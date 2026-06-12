import { configureStore } from '@reduxjs/toolkit'
import { referralClient } from './referralClient'

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => async () => new Response('{}', { status: 200 })
}))

jest.mock('../config/env', () => ({
  getEnv: () => 'https://referral-api.test'
}))

describe('referralClient', () => {
  describe('when wired into a store', () => {
    it('should expose its reducer under reducerPath "referralClient"', () => {
      const store = configureStore({
        reducer: { [referralClient.reducerPath]: referralClient.reducer },
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(referralClient.middleware)
      })
      const state = store.getState() as Record<string, unknown>
      expect(state).toHaveProperty('referralClient')
    })

    it('should declare reducerPath "referralClient"', () => {
      expect(referralClient.reducerPath).toBe('referralClient')
    })
  })
})
