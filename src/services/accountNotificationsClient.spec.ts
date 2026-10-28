import { configureStore } from '@reduxjs/toolkit'
import { accountNotificationsClient } from './accountNotificationsClient'

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => async () => new Response('{}', { status: 200 })
}))

jest.mock('../config/env', () => ({
  getEnv: () => 'https://notifications.test'
}))

describe('accountNotificationsClient', () => {
  describe('when wired into a store', () => {
    it('should expose its reducer under reducerPath "accountNotificationsClient"', () => {
      const store = configureStore({
        reducer: { [accountNotificationsClient.reducerPath]: accountNotificationsClient.reducer },
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(accountNotificationsClient.middleware)
      })
      const state = store.getState() as Record<string, unknown>
      expect(state).toHaveProperty('accountNotificationsClient')
    })

    it('should declare reducerPath "accountNotificationsClient"', () => {
      expect(accountNotificationsClient.reducerPath).toBe('accountNotificationsClient')
    })
  })
})
