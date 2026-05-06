import { configureStore } from '@reduxjs/toolkit'
import { socialClient } from './socialClient'

// decentraland-crypto-fetch references global Request which jsdom omits in older
// node versions; mock the factory so the module under test imports cleanly.
jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => async () => new Response('{}', { status: 200 })
}))

// `src/config` reaches into `import.meta.env` which ts-jest can't compile —
// stub the env getter the client uses for SOCIAL_API_URL.
jest.mock('../config/env', () => ({
  getEnv: () => 'https://social-api.test'
}))

describe('socialClient', () => {
  describe('when wired into a store', () => {
    it('should expose its reducer under reducerPath "socialClient"', () => {
      const store = configureStore({
        reducer: { [socialClient.reducerPath]: socialClient.reducer },
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(socialClient.middleware)
      })
      const state = store.getState() as Record<string, unknown>
      expect(state).toHaveProperty('socialClient')
    })

    it('should declare reducerPath "socialClient"', () => {
      expect(socialClient.reducerPath).toBe('socialClient')
    })
  })
})
