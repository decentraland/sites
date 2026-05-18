/**
 * @jest-environment node
 */
/* eslint-disable import/order */
import { configureStore } from '@reduxjs/toolkit'

const signedFetchMock = jest.fn()
const getIdentityMock = jest.fn()

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => signedFetchMock
}))

jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: (...args: unknown[]) => getIdentityMock(...args)
}))

jest.mock('../config/env', () => ({
  getEnv: (key: string) => (key === 'SOCIAL_API_URL' ? 'https://social-api.test' : undefined)
}))

const fakeStorage = (() => {
  let store: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(store).length
    },
    key(i: number) {
      return Object.keys(store)[i] ?? null
    },
    getItem(k: string) {
      return store[k] ?? null
    },
    setItem(k: string, v: string) {
      store[k] = v
    },
    removeItem(k: string) {
      delete store[k]
    },
    clear() {
      store = {}
    }
  }
})()
;(globalThis as unknown as { localStorage: Storage }).localStorage = fakeStorage as unknown as Storage

import { socialClient } from './socialClient'
/* eslint-enable import/order */

const buildStore = () =>
  configureStore({
    reducer: { [socialClient.reducerPath]: socialClient.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(socialClient.middleware)
  })

const buildIdentity = (expiration: string) => ({
  authChain: [
    { type: 'SIGNER', payload: 'addr', signature: '' },
    { type: 'ECDSA_SIGNED_ENTITY', payload: `Expiration: ${expiration}\nother`, signature: 'sig' }
  ],
  ephemeralIdentity: { address: '0xeph', publicKey: 'pub', privateKey: 'priv' },
  expiration: new Date(expiration)
})

describe('socialClient', () => {
  beforeEach(() => {
    signedFetchMock.mockReset()
    getIdentityMock.mockReset()
    localStorage.clear()
    global.fetch = jest.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
    ) as unknown as typeof fetch
  })

  describe('when wired into a store', () => {
    it('should expose its reducer under reducerPath "socialClient"', () => {
      const store = buildStore()
      expect(store.getState()).toHaveProperty('socialClient')
    })

    it('should declare reducerPath "socialClient"', () => {
      expect(socialClient.reducerPath).toBe('socialClient')
    })
  })

  describe('when a query runs without a stored identity', () => {
    it('should fall back to the unsigned global fetch', async () => {
      const api = socialClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          pingNoIdentity: builder.query<unknown, void>({ query: () => '/v1/ping' })
        })
      })
      const store = buildStore()

      const result = await store.dispatch(api.endpoints.pingNoIdentity.initiate())

      expect(result.data).toEqual({ ok: true })
      expect(signedFetchMock).not.toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('when a query runs with a stored identity', () => {
    it('should call signedFetch with the most recent identity', async () => {
      const older = buildIdentity('2030-01-01T00:00:00Z')
      const newer = buildIdentity('2031-01-01T00:00:00Z')
      localStorage.setItem('single-sign-on-0xolder', 'x')
      localStorage.setItem('single-sign-on-0xnewer', 'x')
      localStorage.setItem('unrelated-key', 'x')
      getIdentityMock.mockImplementation((address: string) => {
        if (address === '0xolder') return older
        if (address === '0xnewer') return newer
        return undefined
      })
      signedFetchMock.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )

      const api = socialClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          pingSigned: builder.query<unknown, void>({ query: () => '/v1/ping' })
        })
      })
      const store = buildStore()

      await store.dispatch(api.endpoints.pingSigned.initiate())

      expect(signedFetchMock).toHaveBeenCalledTimes(1)
      const [, init] = signedFetchMock.mock.calls[0]
      expect(init.identity).toBe(newer)
    })

    it('should ignore identities returned without payload metadata', async () => {
      localStorage.setItem('single-sign-on-0xnoexp', 'x')
      getIdentityMock.mockReturnValue({ authChain: [{ payload: 'signer' }] })

      const api = socialClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          pingNoExp: builder.query<unknown, void>({ query: () => '/v1/ping' })
        })
      })
      const store = buildStore()

      await store.dispatch(api.endpoints.pingNoExp.initiate())

      expect(signedFetchMock).not.toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should ignore non-matching localStorage keys', async () => {
      localStorage.setItem('not-sso-key', 'x')
      const api = socialClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          pingNonMatch: builder.query<unknown, void>({ query: () => '/v1/ping' })
        })
      })
      const store = buildStore()

      await store.dispatch(api.endpoints.pingNonMatch.initiate())

      expect(getIdentityMock).not.toHaveBeenCalled()
    })

    it('should ignore localStorageGetIdentity returning undefined', async () => {
      localStorage.setItem('single-sign-on-0xnone', 'x')
      getIdentityMock.mockReturnValue(undefined)
      const api = socialClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          pingUndef: builder.query<unknown, void>({ query: () => '/v1/ping' })
        })
      })
      const store = buildStore()

      await store.dispatch(api.endpoints.pingUndef.initiate())

      expect(signedFetchMock).not.toHaveBeenCalled()
    })

    it('should recover from localStorage.key throwing inside the identity scan', async () => {
      localStorage.setItem('single-sign-on-0xany', 'x')
      const keySpy = jest.spyOn(fakeStorage, 'key').mockImplementation(() => {
        throw new Error('boom')
      })
      const api = socialClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          pingThrow: builder.query<unknown, void>({ query: () => '/v1/ping' })
        })
      })
      const store = buildStore()

      const result = await store.dispatch(api.endpoints.pingThrow.initiate())

      expect(result.data).toEqual({ ok: true })
      expect(signedFetchMock).not.toHaveBeenCalled()
      keySpy.mockRestore()
    })
  })

  describe('when a custom baseUrl is supplied in the query args', () => {
    it('should use it instead of the SOCIAL_API_URL env value', async () => {
      const api = socialClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          customBase: builder.query<unknown, void>({
            query: () => ({ url: '/v1/whatever', baseUrl: 'https://override.test' })
          })
        })
      })
      const store = buildStore()

      await store.dispatch(api.endpoints.customBase.initiate())

      const fetchMock = global.fetch as jest.Mock
      const calledWith = fetchMock.mock.calls[0][0]
      const requestUrl = typeof calledWith === 'string' ? calledWith : (calledWith as Request).url
      expect(requestUrl).toBe('https://override.test/v1/whatever')
    })
  })

  describe('when SOCIAL_API_URL is not configured', () => {
    it('should surface a FETCH_ERROR result instead of throwing', async () => {
      jest.resetModules()
      jest.doMock('../config/env', () => ({ getEnv: () => undefined }))
      jest.doMock('decentraland-crypto-fetch', () => ({ signedFetchFactory: () => signedFetchMock }))
      jest.doMock('@dcl/single-sign-on-client', () => ({ localStorageGetIdentity: getIdentityMock }))
      const isolated = await import('./socialClient')
      const api = isolated.socialClient.injectEndpoints({
        overrideExisting: true,
        endpoints: builder => ({
          pingNoUrl: builder.query<unknown, void>({ query: () => '/v1/ping' })
        })
      })
      const store = configureStore({
        reducer: { [isolated.socialClient.reducerPath]: isolated.socialClient.reducer },
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(isolated.socialClient.middleware)
      })

      const result = await store.dispatch(api.endpoints.pingNoUrl.initiate())

      expect((result.error as { status: string }).status).toBe('FETCH_ERROR')
    })
  })
})
