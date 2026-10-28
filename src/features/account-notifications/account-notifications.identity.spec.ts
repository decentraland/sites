import { configureStore } from '@reduxjs/toolkit'
import type { AuthIdentity } from '@dcl/crypto'
import { accountNotificationsClient } from '../../services/accountNotificationsClient'
import { advanceAuthSession } from '../../utils/authSession'
import { accountNotificationsApi } from './account-notifications.client'

const mockSignedFetch = jest.fn()
const mockResolveActiveIdentity = jest.fn()
jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory:
    () =>
    (...args: unknown[]) =>
      mockSignedFetch(...args)
}))
jest.mock('../../config/env', () => ({ getEnv: () => 'https://notifications.test' }))
jest.mock('../../utils/activeIdentity', () => ({ resolveActiveIdentity: () => mockResolveActiveIdentity() }))

const createTestStore = () =>
  configureStore({
    reducer: { [accountNotificationsClient.reducerPath]: accountNotificationsClient.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(accountNotificationsClient.middleware)
  })
const identityFor = (address: string) => ({ authChain: [{ payload: address }], expiration: new Date(Date.now() + 60000) }) as AuthIdentity
const subscriptionResponse = (address: string) =>
  new Response(JSON.stringify({ address, email: `${address}@example.com`, details: {} }), {
    headers: { 'Content-Type': 'application/json' }
  })

describe('when a subscription request is scoped to a wallet', () => {
  let store: ReturnType<typeof createTestStore>
  let identityA: AuthIdentity
  let identityB: AuthIdentity

  beforeEach(() => {
    store = createTestStore()
    identityA = identityFor('0xaaa')
    identityB = identityFor('0xbbb')
    mockResolveActiveIdentity.mockReturnValue(identityA)
  })

  afterEach(() => {
    store.dispatch(accountNotificationsClient.util.resetApiState())
    jest.resetAllMocks()
  })

  it('should reject a request whose cache address differs from the signer', async () => {
    mockResolveActiveIdentity.mockReturnValue(identityB)
    mockSignedFetch.mockResolvedValueOnce(subscriptionResponse('0xbbb'))
    await expect(
      store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xaaa' })).unwrap()
    ).rejects.toMatchObject({ status: 401 })
    expect(mockSignedFetch).not.toHaveBeenCalled()
  })

  it('should reuse the same account entry for differently cased addresses', async () => {
    mockSignedFetch.mockImplementation(() => Promise.resolve(subscriptionResponse('0xaaa')))
    await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xAaA' })).unwrap()
    await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xaaa' })).unwrap()
    expect(mockSignedFetch).toHaveBeenCalledTimes(1)
  })

  it('should use separate entries for two authenticated wallets', async () => {
    mockSignedFetch.mockResolvedValueOnce(subscriptionResponse('0xaaa')).mockResolvedValueOnce(subscriptionResponse('0xbbb'))
    await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xaaa' })).unwrap()
    mockResolveActiveIdentity.mockReturnValue(identityB)
    await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xbbb' })).unwrap()
    expect(accountNotificationsApi.endpoints.getSubscription.select({ address: '0xaaa' })(store.getState()).data?.email).toBe(
      '0xaaa@example.com'
    )
    expect(accountNotificationsApi.endpoints.getSubscription.select({ address: '0xbbb' })(store.getState()).data?.email).toBe(
      '0xbbb@example.com'
    )
    expect(mockSignedFetch).toHaveBeenCalledTimes(2)
  })

  it('should refuse private requests after logout without sending unsigned traffic', async () => {
    mockResolveActiveIdentity.mockReturnValue(undefined)
    await expect(
      store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xaaa' })).unwrap()
    ).rejects.toMatchObject({ status: 401 })
    expect(mockSignedFetch).not.toHaveBeenCalled()
  })

  describe('and an email mutation finishes in a later session of the same wallet', () => {
    let finish: (response: Response) => void
    let mutation: ReturnType<ReturnType<typeof accountNotificationsApi.endpoints.setEmail.initiate>>

    beforeEach(async () => {
      mockSignedFetch.mockResolvedValueOnce(subscriptionResponse('0xaaa'))
      await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xaaa' })).unwrap()
      mockSignedFetch.mockReturnValueOnce(
        new Promise<Response>(resolve => {
          finish = resolve
        })
      )
      mutation = store.dispatch(accountNotificationsApi.endpoints.setEmail.initiate({ address: '0xaaa', email: 'old-session@example.com' }))
      await Promise.resolve()
      await Promise.resolve()
    })

    it('should not patch the new session with the old email', async () => {
      advanceAuthSession()
      store.dispatch(accountNotificationsClient.util.resetApiState())
      mockSignedFetch.mockResolvedValueOnce(subscriptionResponse('0xaaa'))
      await store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xaaa' })).unwrap()
      finish(new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
      await mutation
      expect(
        accountNotificationsApi.endpoints.getSubscription.select({ address: '0xaaa' })(store.getState()).data?.unconfirmedEmail
      ).toBeUndefined()
    })
  })

  describe('and the active wallet changes before the response arrives', () => {
    let finish: (response: Response) => void
    let pendingResponse: Promise<Response>
    let request: ReturnType<ReturnType<typeof accountNotificationsApi.endpoints.getSubscription.initiate>>

    beforeEach(() => {
      pendingResponse = new Promise(resolve => {
        finish = resolve
      })
      mockSignedFetch.mockReturnValueOnce(pendingResponse)
    })

    it('should reject a late response even after the same account signs back in', async () => {
      request = store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xaaa' }))
      await Promise.resolve()
      await Promise.resolve()
      advanceAuthSession()
      advanceAuthSession()
      finish(subscriptionResponse('0xaaa'))
      await expect(request.unwrap()).rejects.toMatchObject({ status: 401 })
    })

    it('should discard the response from the previous session', async () => {
      request = store.dispatch(accountNotificationsApi.endpoints.getSubscription.initiate({ address: '0xaaa' }))
      await Promise.resolve()
      await Promise.resolve()
      mockResolveActiveIdentity.mockReturnValue(identityB)
      finish(subscriptionResponse('0xaaa'))
      await expect(request.unwrap()).rejects.toMatchObject({ status: 401 })
    })
  })
})
