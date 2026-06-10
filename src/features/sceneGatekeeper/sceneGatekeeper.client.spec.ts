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
import { adminsEndpoints } from './admins.client'
import { streamingEndpoints } from './streaming.client'

const identity = {} as AuthIdentity
const scope = { identity, sceneId: 'bafyscene', realmName: 'world.dcl.eth', parcel: '0,0' }

function makeStore() {
  return configureStore({
    reducer: { [gatekeeperClient.reducerPath]: gatekeeperClient.reducer },
    middleware: getDefault => getDefault().concat(gatekeeperClient.middleware)
  })
}

const ok = (body: unknown, status = 200) => ({ ok: true, status, json: () => Promise.resolve(body), text: () => Promise.resolve('') })

describe('sceneGatekeeper clients', () => {
  afterEach(() => jest.resetAllMocks())

  describe('registration', () => {
    it('should register the admin + streaming endpoints on the gatekeeper client', () => {
      for (const name of [
        'getSceneAdmins',
        'addSceneAdmin',
        'removeSceneAdmin',
        'getSceneStream',
        'createSceneStream',
        'resetSceneStream',
        'revokeSceneStream'
      ]) {
        expect(gatekeeperClient.endpoints).toHaveProperty(name)
      }
    })
  })

  describe('getSceneAdmins', () => {
    it('should error without identity (no request)', async () => {
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.getSceneAdmins.initiate({ ...scope, identity: undefined }))
      expect(result.isError).toBe(true)
      expect(mockSignedFetch).not.toHaveBeenCalled()
    })

    it('should sign with the realm-object metadata and return the admins array', async () => {
      mockSignedFetch.mockResolvedValue(ok([{ admin: '0x1', name: 'a', canBeRemoved: true }]))
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.getSceneAdmins.initiate(scope))
      expect(result.data).toHaveLength(1)
      const [url, options] = mockSignedFetch.mock.calls[0]
      expect(url).toContain('/scene-admin')
      expect(options.metadata).toMatchObject({ realm: { serverName: 'world.dcl.eth' }, sceneId: 'bafyscene' })
    })
  })

  describe('getSceneAdmins (extra paths)', () => {
    it('should unwrap an { admins } envelope when the server wraps the list', async () => {
      mockSignedFetch.mockResolvedValue(ok({ admins: [{ admin: '0x1', name: 'a', canBeRemoved: true }] }))
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.getSceneAdmins.initiate(scope))
      expect(result.data).toHaveLength(1)
    })

    it('should default to an empty array when the envelope has no admins', async () => {
      mockSignedFetch.mockResolvedValue(ok({}))
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.getSceneAdmins.initiate(scope))
      expect(result.data).toEqual([])
    })

    it('should surface a non-ok status', async () => {
      mockSignedFetch.mockResolvedValue({ ok: false, status: 401, text: () => Promise.resolve('') })
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.getSceneAdmins.initiate(scope))
      expect(result.isError).toBe(true)
    })

    it('should map a thrown error to FETCH_ERROR', async () => {
      mockSignedFetch.mockRejectedValue(new Error('down'))
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.getSceneAdmins.initiate(scope))
      expect(result.error).toMatchObject({ status: 'FETCH_ERROR' })
    })
  })

  describe('addSceneAdmin', () => {
    it('should POST { admin } for an address and { name } otherwise', async () => {
      mockSignedFetch.mockResolvedValue(ok(undefined))
      const store = makeStore()
      await store.dispatch(adminsEndpoints.endpoints.addSceneAdmin.initiate({ ...scope, admin: '0xabc' }))
      expect(mockSignedFetch.mock.calls[0][1].body).toBe(JSON.stringify({ admin: '0xabc' }))
    })

    it('should POST { name } when no admin address is given', async () => {
      mockSignedFetch.mockResolvedValue(ok(undefined))
      const store = makeStore()
      await store.dispatch(adminsEndpoints.endpoints.addSceneAdmin.initiate({ ...scope, name: 'boedo' }))
      expect(mockSignedFetch.mock.calls[0][1].body).toBe(JSON.stringify({ name: 'boedo' }))
    })

    it('should error without an identity', async () => {
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.addSceneAdmin.initiate({ ...scope, identity: undefined, admin: '0x1' }))
      expect('error' in result && result.error).toBeTruthy()
      expect(mockSignedFetch).not.toHaveBeenCalled()
    })

    it('should surface a non-ok status', async () => {
      mockSignedFetch.mockResolvedValue({ ok: false, status: 403, text: () => Promise.resolve('') })
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.addSceneAdmin.initiate({ ...scope, admin: '0x1' }))
      expect('error' in result && result.error).toMatchObject({ status: 403 })
    })

    it('should map a thrown error to FETCH_ERROR', async () => {
      mockSignedFetch.mockRejectedValue(new Error('down'))
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.addSceneAdmin.initiate({ ...scope, admin: '0x1' }))
      expect('error' in result && result.error).toMatchObject({ status: 'FETCH_ERROR' })
    })
  })

  describe('removeSceneAdmin', () => {
    it('should DELETE { admin } and resolve', async () => {
      mockSignedFetch.mockResolvedValue(ok(undefined))
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.removeSceneAdmin.initiate({ ...scope, admin: '0xabc' }))
      expect('error' in result && result.error).toBeFalsy()
      const [, options] = mockSignedFetch.mock.calls[0]
      expect(options.method).toBe('DELETE')
      expect(options.body).toBe(JSON.stringify({ admin: '0xabc' }))
    })

    it('should error without an identity', async () => {
      const store = makeStore()
      const result = await store.dispatch(
        adminsEndpoints.endpoints.removeSceneAdmin.initiate({ ...scope, identity: undefined, admin: '0x1' })
      )
      expect('error' in result && result.error).toBeTruthy()
      expect(mockSignedFetch).not.toHaveBeenCalled()
    })

    it('should surface a non-ok status', async () => {
      mockSignedFetch.mockResolvedValue({ ok: false, status: 403, text: () => Promise.resolve('') })
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.removeSceneAdmin.initiate({ ...scope, admin: '0x1' }))
      expect('error' in result && result.error).toMatchObject({ status: 403 })
    })

    it('should map a thrown error to FETCH_ERROR', async () => {
      mockSignedFetch.mockRejectedValue(new Error('down'))
      const store = makeStore()
      const result = await store.dispatch(adminsEndpoints.endpoints.removeSceneAdmin.initiate({ ...scope, admin: '0x1' }))
      expect('error' in result && result.error).toMatchObject({ status: 'FETCH_ERROR' })
    })
  })

  describe('getSceneStream', () => {
    it('should return null on 404 (no key yet)', async () => {
      mockSignedFetch.mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve('') })
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.getSceneStream.initiate(scope))
      expect(result.data).toBeNull()
      expect(result.isError).toBe(false)
    })

    it('should return the access on success', async () => {
      mockSignedFetch.mockResolvedValue(ok({ streaming_url: 'rtmp://x', streaming_key: 'k', created_at: 1, ends_at: 2 }))
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.getSceneStream.initiate(scope))
      expect(result.data?.streaming_key).toBe('k')
    })

    it('should error without an identity', async () => {
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.getSceneStream.initiate({ ...scope, identity: undefined }))
      expect(result.isError).toBe(true)
      expect(mockSignedFetch).not.toHaveBeenCalled()
    })

    it('should surface a non-404 non-ok status', async () => {
      mockSignedFetch.mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('') })
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.getSceneStream.initiate(scope))
      expect(result.error).toMatchObject({ status: 500 })
    })

    it('should map a thrown error to FETCH_ERROR', async () => {
      mockSignedFetch.mockRejectedValue(new Error('down'))
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.getSceneStream.initiate(scope))
      expect(result.error).toMatchObject({ status: 'FETCH_ERROR' })
    })
  })

  describe('createSceneStream', () => {
    it('should PUT/POST to scene-stream-access and return the new access', async () => {
      mockSignedFetch.mockResolvedValue(ok({ streaming_url: 'rtmp://x', streaming_key: 'new' }))
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.createSceneStream.initiate(scope))
      expect('data' in result && result.data?.streaming_key).toBe('new')
      const [url, options] = mockSignedFetch.mock.calls[0]
      expect(url).toContain('/scene-stream-access')
      expect(options.method).toBe('POST')
    })

    it('should error without an identity', async () => {
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.createSceneStream.initiate({ ...scope, identity: undefined }))
      expect('error' in result && result.error).toBeTruthy()
      expect(mockSignedFetch).not.toHaveBeenCalled()
    })

    it('should surface a non-ok status', async () => {
      mockSignedFetch.mockResolvedValue({ ok: false, status: 403, text: () => Promise.resolve('') })
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.createSceneStream.initiate(scope))
      expect('error' in result && result.error).toMatchObject({ status: 403 })
    })

    it('should map a thrown error to FETCH_ERROR', async () => {
      mockSignedFetch.mockRejectedValue(new Error('down'))
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.createSceneStream.initiate(scope))
      expect('error' in result && result.error).toMatchObject({ status: 'FETCH_ERROR' })
    })
  })

  describe('resetSceneStream', () => {
    it('should PUT to scene-stream-access and return the new access', async () => {
      mockSignedFetch.mockResolvedValue(ok({ streaming_url: 'rtmp://x', streaming_key: 'reset' }))
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.resetSceneStream.initiate(scope))
      expect('data' in result && result.data?.streaming_key).toBe('reset')
      expect(mockSignedFetch.mock.calls[0][1].method).toBe('PUT')
    })
  })

  describe('revokeSceneStream', () => {
    it('should DELETE the access and resolve', async () => {
      mockSignedFetch.mockResolvedValue(ok(undefined))
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.revokeSceneStream.initiate(scope))
      expect('error' in result && result.error).toBeFalsy()
      expect(mockSignedFetch.mock.calls[0][1].method).toBe('DELETE')
    })

    it('should error without an identity', async () => {
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.revokeSceneStream.initiate({ ...scope, identity: undefined }))
      expect('error' in result && result.error).toBeTruthy()
      expect(mockSignedFetch).not.toHaveBeenCalled()
    })

    it('should surface a non-ok status', async () => {
      mockSignedFetch.mockResolvedValue({ ok: false, status: 403, text: () => Promise.resolve('') })
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.revokeSceneStream.initiate(scope))
      expect('error' in result && result.error).toMatchObject({ status: 403 })
    })

    it('should map a thrown error to FETCH_ERROR', async () => {
      mockSignedFetch.mockRejectedValue(new Error('down'))
      const store = makeStore()
      const result = await store.dispatch(streamingEndpoints.endpoints.revokeSceneStream.initiate(scope))
      expect('error' in result && result.error).toMatchObject({ status: 'FETCH_ERROR' })
    })
  })
})
