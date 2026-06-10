const mockSignedFetch = jest.fn()
jest.mock('decentraland-crypto-fetch', () => ({
  __esModule: true,
  signedFetchFactory: () => mockSignedFetch
}))
jest.mock('../../config/env', () => ({
  getEnv: jest.fn(() => 'https://gatekeeper.test')
}))

import { configureStore } from '@reduxjs/toolkit'
import type { AuthIdentity } from '@dcl/crypto'
import { gatekeeperClient } from '../../services/gatekeeperClient'
import { banBody, bansEndpoints, useAddSceneBanMutation, useGetSceneBansQuery, useRemoveSceneBanMutation } from './bans.client'

const identity = {} as AuthIdentity
const scope = { identity, sceneId: 'bafyscene', realmName: 'world.dcl.eth', parcel: '0,0' }

function makeStore() {
  return configureStore({
    reducer: { [gatekeeperClient.reducerPath]: gatekeeperClient.reducer },
    middleware: getDefault => getDefault().concat(gatekeeperClient.middleware)
  })
}

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(body), text: () => Promise.resolve('') }
}

describe('bans.client', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('registration', () => {
    it('should register the three ban endpoints on the gatekeeper client', () => {
      expect(gatekeeperClient.endpoints).toHaveProperty('getSceneBans')
      expect(gatekeeperClient.endpoints).toHaveProperty('addSceneBan')
      expect(gatekeeperClient.endpoints).toHaveProperty('removeSceneBan')
    })

    it('should expose the generated hooks', () => {
      expect(typeof useGetSceneBansQuery).toBe('function')
      expect(typeof useAddSceneBanMutation).toBe('function')
      expect(typeof useRemoveSceneBanMutation).toBe('function')
    })

    it('should build a store with the gatekeeper reducerPath', () => {
      expect(makeStore().getState()).toHaveProperty(gatekeeperClient.reducerPath)
    })
  })

  describe('banBody', () => {
    it('should prefer the address when present', () => {
      expect(banBody({ address: '0xabc', name: 'nope' })).toBe(JSON.stringify({ banned_address: '0xabc' }))
    })

    it('should fall back to the name', () => {
      expect(banBody({ name: 'boedo' })).toBe(JSON.stringify({ banned_name: 'boedo' }))
    })
  })

  describe('getSceneBans queryFn', () => {
    it('should error without an identity (no signed request)', async () => {
      const store = makeStore()
      const result = await store.dispatch(bansEndpoints.endpoints.getSceneBans.initiate({ ...scope, identity: undefined }))
      expect(result.isError).toBe(true)
      expect(mockSignedFetch).not.toHaveBeenCalled()
    })

    it('should sign the request with the scene metadata and return the results', async () => {
      mockSignedFetch.mockResolvedValue(
        okResponse({ results: [{ bannedAddress: '0x1', name: 'a' }], total: 1, page: 1, pages: 1, limit: 50 })
      )
      const store = makeStore()
      const result = await store.dispatch(bansEndpoints.endpoints.getSceneBans.initiate(scope))
      expect(result.data?.results).toHaveLength(1)
      const [, options] = mockSignedFetch.mock.calls[0]
      expect(options.method).toBe('GET')
      expect(options.metadata).toMatchObject({ sceneId: 'bafyscene', parcel: '0,0', realm: { serverName: 'world.dcl.eth' } })
    })

    it('should error on a non-ok response', async () => {
      mockSignedFetch.mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('nope') })
      const store = makeStore()
      const result = await store.dispatch(bansEndpoints.endpoints.getSceneBans.initiate(scope))
      expect(result.isError).toBe(true)
    })

    it('should map a thrown fetch error to a generic FETCH_ERROR status', async () => {
      mockSignedFetch.mockRejectedValue(new Error('network down'))
      const store = makeStore()
      const result = await store.dispatch(bansEndpoints.endpoints.getSceneBans.initiate(scope))
      expect(result.isError).toBe(true)
      expect(result.error).toMatchObject({ status: 'FETCH_ERROR' })
    })
  })

  describe('addSceneBan / removeSceneBan', () => {
    it('should POST a ban body and resolve', async () => {
      mockSignedFetch.mockResolvedValue(okResponse(undefined))
      const store = makeStore()
      const result = await store.dispatch(bansEndpoints.endpoints.addSceneBan.initiate({ ...scope, address: '0xabc' }))
      expect('error' in result && result.error).toBeFalsy()
      const [, options] = mockSignedFetch.mock.calls[0]
      expect(options.method).toBe('POST')
      expect(options.body).toBe(JSON.stringify({ banned_address: '0xabc' }))
    })

    it('should DELETE a ban and resolve', async () => {
      mockSignedFetch.mockResolvedValue(okResponse(undefined))
      const store = makeStore()
      const result = await store.dispatch(bansEndpoints.endpoints.removeSceneBan.initiate({ ...scope, address: '0xabc' }))
      expect('error' in result && result.error).toBeFalsy()
      const [, options] = mockSignedFetch.mock.calls[0]
      expect(options.method).toBe('DELETE')
    })

    it('should POST a ban body built from the name when no address is given', async () => {
      mockSignedFetch.mockResolvedValue(okResponse(undefined))
      const store = makeStore()
      await store.dispatch(bansEndpoints.endpoints.addSceneBan.initiate({ ...scope, name: 'boedo' }))
      expect(mockSignedFetch.mock.calls[0][1].body).toBe(JSON.stringify({ banned_name: 'boedo' }))
    })

    it('should error when adding a ban without an identity', async () => {
      const store = makeStore()
      const result = await store.dispatch(bansEndpoints.endpoints.addSceneBan.initiate({ ...scope, identity: undefined, address: '0xabc' }))
      expect('error' in result && result.error).toBeTruthy()
      expect(mockSignedFetch).not.toHaveBeenCalled()
    })

    it('should error when removing a ban without an identity', async () => {
      const store = makeStore()
      const result = await store.dispatch(
        bansEndpoints.endpoints.removeSceneBan.initiate({ ...scope, identity: undefined, address: '0xabc' })
      )
      expect('error' in result && result.error).toBeTruthy()
      expect(mockSignedFetch).not.toHaveBeenCalled()
    })

    it('should surface a non-ok status when adding a ban', async () => {
      mockSignedFetch.mockResolvedValue({ ok: false, status: 403, text: () => Promise.resolve('') })
      const store = makeStore()
      const result = await store.dispatch(bansEndpoints.endpoints.addSceneBan.initiate({ ...scope, address: '0xabc' }))
      expect('error' in result && result.error).toMatchObject({ status: 403 })
    })

    it('should surface a non-ok status when removing a ban', async () => {
      mockSignedFetch.mockResolvedValue({ ok: false, status: 403, text: () => Promise.resolve('') })
      const store = makeStore()
      const result = await store.dispatch(bansEndpoints.endpoints.removeSceneBan.initiate({ ...scope, address: '0xabc' }))
      expect('error' in result && result.error).toMatchObject({ status: 403 })
    })

    it('should map thrown errors to FETCH_ERROR when adding', async () => {
      mockSignedFetch.mockRejectedValue(new Error('boom'))
      const store = makeStore()
      const result = await store.dispatch(bansEndpoints.endpoints.addSceneBan.initiate({ ...scope, address: '0xabc' }))
      expect('error' in result && result.error).toMatchObject({ status: 'FETCH_ERROR' })
    })

    it('should map thrown errors to FETCH_ERROR when removing', async () => {
      mockSignedFetch.mockRejectedValue(new Error('boom'))
      const store = makeStore()
      const result = await store.dispatch(bansEndpoints.endpoints.removeSceneBan.initiate({ ...scope, address: '0xabc' }))
      expect('error' in result && result.error).toMatchObject({ status: 'FETCH_ERROR' })
    })
  })
})
