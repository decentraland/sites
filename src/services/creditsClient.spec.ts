import { configureStore } from '@reduxjs/toolkit'
import { creditsClient } from './creditsClient'

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => async () => new Response('{}', { status: 200 })
}))

jest.mock('../config/env', () => ({
  getEnv: () => 'https://credits.test'
}))

describe('creditsClient', () => {
  describe('when wired into a store', () => {
    it('should expose its reducer under reducerPath "creditsClient"', () => {
      const store = configureStore({
        reducer: { [creditsClient.reducerPath]: creditsClient.reducer },
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(creditsClient.middleware)
      })
      const state = store.getState() as Record<string, unknown>
      expect(state).toHaveProperty('creditsClient')
    })

    it('should declare reducerPath "creditsClient"', () => {
      expect(creditsClient.reducerPath).toBe('creditsClient')
    })
  })
})
