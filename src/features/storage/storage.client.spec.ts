jest.mock('decentraland-crypto-fetch', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('../../config/env', () => ({ getEnv: jest.fn(() => 'https://storage') }))

import { configureStore } from '@reduxjs/toolkit'
import signedFetchLib from 'decentraland-crypto-fetch'
import { storageClient } from '../../services/storageClient'
import { storageEndpoints } from './index'

const signedFetchMock = signedFetchLib as unknown as jest.Mock

const makeResponse = (body: unknown, init: { status?: number } = {}): Response => {
  const status = init.status ?? 200
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    json: async () => body
  } as unknown as Response
}

const setupStore = () =>
  configureStore({
    reducer: { [storageClient.reducerPath]: storageClient.reducer },
    middleware: g => g({ serializableCheck: false }).concat(storageClient.middleware)
  })

const identity = { ephemeralIdentity: {}, authChain: [{ type: 'SIGNER', payload: '0xowner' }] } as unknown as Parameters<
  typeof storageEndpoints.endpoints.setEnv.initiate
>[0]['identity']
const ctx = { realm: 'world.dcl.eth', position: '0,0' }

describe('storage.client endpoints', () => {
  beforeEach(() => signedFetchMock.mockReset())

  it('listEnvKeys maps the server data to {key} entries', async () => {
    signedFetchMock.mockResolvedValue(makeResponse({ data: ['API_KEY', 'DB_URL'] }))
    const store = setupStore()
    const result = await store.dispatch(storageEndpoints.endpoints.listEnvKeys.initiate({ identity, ...ctx }))
    expect(result.data).toEqual([{ key: 'API_KEY' }, { key: 'DB_URL' }])
  })

  it('listEnvKeys surfaces HTTP errors', async () => {
    signedFetchMock.mockResolvedValue(makeResponse('nope', { status: 401 }))
    const store = setupStore()
    const result = await store.dispatch(storageEndpoints.endpoints.listEnvKeys.initiate({ identity, ...ctx }))
    expect((result.error as { status: number }).status).toBe(401)
  })

  it('setEnv issues a PUT with the value body', async () => {
    signedFetchMock.mockResolvedValue(makeResponse(null, { status: 204 }))
    const store = setupStore()
    const result = await store.dispatch(storageEndpoints.endpoints.setEnv.initiate({ identity, key: 'API_KEY', value: 'x', ...ctx }))
    expect(result.error).toBeUndefined()
    expect(signedFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/env/API_KEY'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ value: 'x' }) })
    )
  })

  it('setEnv surfaces server errors', async () => {
    signedFetchMock.mockResolvedValue(makeResponse('nope', { status: 401 }))
    const store = setupStore()
    const result = await store.dispatch(storageEndpoints.endpoints.setEnv.initiate({ identity, key: 'API_KEY', value: 'x', ...ctx }))
    expect((result.error as { status: number }).status).toBe(401)
  })

  it('deleteEnv issues a DELETE', async () => {
    signedFetchMock.mockResolvedValue(makeResponse(null, { status: 204 }))
    const store = setupStore()
    await store.dispatch(storageEndpoints.endpoints.deleteEnv.initiate({ identity, key: 'API_KEY', ...ctx }))
    expect(signedFetchMock).toHaveBeenCalledWith(expect.stringContaining('/env/API_KEY'), expect.objectContaining({ method: 'DELETE' }))
  })

  it('clearEnv issues DELETE /env with the confirm-all header', async () => {
    signedFetchMock.mockResolvedValue(makeResponse(null, { status: 204 }))
    const store = setupStore()
    await store.dispatch(storageEndpoints.endpoints.clearEnv.initiate({ identity, ...ctx }))
    expect(signedFetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/env'),
      expect.objectContaining({ method: 'DELETE', headers: { 'X-Confirm-Delete-All': 'true' } })
    )
  })

  it('listSceneKeys + getSceneValue + setSceneValue round-trip a value', async () => {
    const store = setupStore()
    signedFetchMock.mockResolvedValueOnce(makeResponse({ data: [{ key: 'gameState' }] }))
    const list = await store.dispatch(storageEndpoints.endpoints.listSceneKeys.initiate({ identity, ...ctx }))
    expect(list.data).toEqual([{ key: 'gameState' }])

    signedFetchMock.mockResolvedValueOnce(makeResponse({ value: 42 }))
    const get = await store.dispatch(storageEndpoints.endpoints.getSceneValue.initiate({ identity, key: 'gameState', ...ctx }))
    expect(get.data).toEqual({ key: 'gameState', value: 42 })

    signedFetchMock.mockResolvedValueOnce(makeResponse({ value: { level: 2 } }))
    const set = await store.dispatch(
      storageEndpoints.endpoints.setSceneValue.initiate({ identity, key: 'gameState', value: { level: 2 }, ...ctx })
    )
    expect(set.data).toEqual({ key: 'gameState', value: { level: 2 } })
  })

  it('deleteSceneValue + clearScene fire DELETE', async () => {
    signedFetchMock.mockResolvedValue(makeResponse(null, { status: 204 }))
    const store = setupStore()
    await store.dispatch(storageEndpoints.endpoints.deleteSceneValue.initiate({ identity, key: 'gameState', ...ctx }))
    await store.dispatch(storageEndpoints.endpoints.clearScene.initiate({ identity, ...ctx }))
    const deletes = signedFetchMock.mock.calls.filter(c => (c[1] as { method: string }).method === 'DELETE')
    expect(deletes.length).toBeGreaterThanOrEqual(2)
  })

  it('listPlayers + listPlayerKeys + get/set/delete player value', async () => {
    const store = setupStore()
    signedFetchMock.mockResolvedValueOnce(makeResponse({ data: ['0xa'] }))
    const players = await store.dispatch(storageEndpoints.endpoints.listPlayers.initiate({ identity, ...ctx }))
    expect(players.data).toEqual(['0xa'])

    signedFetchMock.mockResolvedValueOnce(makeResponse({ data: [{ key: 'inventory' }] }))
    const keys = await store.dispatch(storageEndpoints.endpoints.listPlayerKeys.initiate({ identity, address: '0xa', ...ctx }))
    expect(keys.data).toEqual([{ key: 'inventory' }])

    signedFetchMock.mockResolvedValueOnce(makeResponse({ value: 'old' }))
    const get = await store.dispatch(
      storageEndpoints.endpoints.getPlayerValue.initiate({ identity, address: '0xa', key: 'inventory', ...ctx })
    )
    expect(get.data).toEqual({ key: 'inventory', value: 'old' })

    signedFetchMock.mockResolvedValueOnce(makeResponse({ value: 'new' }))
    const set = await store.dispatch(
      storageEndpoints.endpoints.setPlayerValue.initiate({ identity, address: '0xa', key: 'inventory', value: 'new', ...ctx })
    )
    expect(set.data).toEqual({ key: 'inventory', value: 'new' })

    signedFetchMock.mockResolvedValueOnce(makeResponse(null, { status: 204 }))
    const del = await store.dispatch(
      storageEndpoints.endpoints.deletePlayerValue.initiate({ identity, address: '0xa', key: 'inventory', ...ctx })
    )
    expect(del.error).toBeUndefined()
  })

  it('clearPlayer + clearAllPlayers issue DELETE', async () => {
    signedFetchMock.mockResolvedValue(makeResponse(null, { status: 204 }))
    const store = setupStore()
    await store.dispatch(storageEndpoints.endpoints.clearPlayer.initiate({ identity, address: '0xa', ...ctx }))
    await store.dispatch(storageEndpoints.endpoints.clearAllPlayers.initiate({ identity, ...ctx }))
    expect(signedFetchMock).toHaveBeenCalled()
  })

  it('getContributableDomains transforms snake_case into camelCase', async () => {
    signedFetchMock.mockResolvedValue(
      makeResponse({
        domains: [{ name: 'foo.dcl.eth', user_permissions: ['deploy'], size: '100', owner: '0xowner' }]
      })
    )
    const store = setupStore()
    const result = await store.dispatch(storageEndpoints.endpoints.getContributableDomains.initiate({ identity }))
    expect(result.data).toEqual([{ name: 'foo.dcl.eth', userPermissions: ['deploy'], size: '100', owner: '0xowner' }])
  })

  it('getWorldScenes derives display.title when present', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse({
        scenes: [
          {
            entity: { metadata: { display: { title: 'My Scene' }, scene: { base: '0,0', parcels: ['0,0'] } }, pointers: [] },
            parcels: ['0,0']
          }
        ],
        total: 1
      })
    )
    const store = setupStore()
    const result = await store.dispatch(storageEndpoints.endpoints.getWorldScenes.initiate({ worldName: 'foo.dcl.eth' }))
    expect(result.data?.[0].title).toBe('My Scene')
    fetchSpy.mockRestore()
  })

  it('getWorldScenes falls back to scene.base when no display title is provided', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeResponse({
        scenes: [
          {
            entity: { metadata: { scene: { base: '5,5', parcels: ['5,5'] } }, pointers: [] },
            parcels: ['5,5']
          }
        ],
        total: 1
      })
    )
    const store = setupStore()
    const result = await store.dispatch(storageEndpoints.endpoints.getWorldScenes.initiate({ worldName: 'foo.dcl.eth' }))
    expect(result.data?.[0].title).toBe('5,5')
    expect(result.data?.[0].baseParcel).toBe('5,5')
    fetchSpy.mockRestore()
  })

  it('getWorldScenes surfaces HTTP errors', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(makeResponse('nope', { status: 500 }))
    const store = setupStore()
    const result = await store.dispatch(storageEndpoints.endpoints.getWorldScenes.initiate({ worldName: 'foo.dcl.eth' }))
    expect((result.error as { status: number }).status).toBe(500)
    fetchSpy.mockRestore()
  })

  it('getWorldScenes wraps thrown exceptions as FETCH_ERROR', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
    const store = setupStore()
    const result = await store.dispatch(storageEndpoints.endpoints.getWorldScenes.initiate({ worldName: 'foo.dcl.eth' }))
    expect((result.error as { status: string }).status).toBe('FETCH_ERROR')
    fetchSpy.mockRestore()
  })
})
