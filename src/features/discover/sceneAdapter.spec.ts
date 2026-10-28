/* eslint-disable import/order -- jest.mock stubs must sit between the type
   import and the module import so the env chain is stubbed before eval */
import type { AuthIdentity } from '@dcl/crypto'

const mockSignedFetch = jest.fn()
const mockGetGuestIdentity = jest.fn()
// Mutable env map — the config module reads through this closure so tests can
// drop keys to exercise the fallback constants without re-mocking the module.
const mockEnvValues: Record<string, string | undefined> = {}

jest.mock('decentraland-crypto-fetch', () => ({
  signedFetchFactory: () => mockSignedFetch
}))
jest.mock('../../config/env', () => ({
  getEnv: (key: string) => mockEnvValues[key]
}))
jest.mock('./guestIdentity', () => ({
  getGuestIdentity: () => mockGetGuestIdentity()
}))

import { fetchCastWatcherToken, fetchSceneAdapter, fetchWorldScenes, getLivePeerUrl, getWorldsContentServerUrl } from './sceneAdapter'
/* eslint-enable import/order */

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as unknown as Response
}

const guestIdentity = { authChain: [], expiration: new Date() } as unknown as AuthIdentity
const userIdentity = { authChain: [{ payload: 'user' }], expiration: new Date() } as unknown as AuthIdentity

describe('sceneAdapter', () => {
  let fetchMock: jest.Mock
  let warnSpy: jest.SpyInstance
  let infoSpy: jest.SpyInstance

  beforeEach(() => {
    mockEnvValues.GATEKEEPER_URL = 'https://gatekeeper.test'
    mockEnvValues.PEER_URL = 'https://peer.test'
    mockEnvValues.WORLDS_CONTENT_SERVER_URL = 'https://worlds.test'
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
    mockGetGuestIdentity.mockResolvedValue(guestIdentity)
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warnSpy.mockRestore()
    infoSpy.mockRestore()
    jest.resetAllMocks()
  })

  describe('when resolving the worlds-content-server url', () => {
    it('should return the env value when set', () => {
      expect(getWorldsContentServerUrl()).toBe('https://worlds.test')
    })

    it('should fall back to the prod cluster when the env key is missing', () => {
      mockEnvValues.WORLDS_CONTENT_SERVER_URL = undefined
      expect(getWorldsContentServerUrl()).toBe('https://worlds-content-server.decentraland.org')
    })
  })

  describe('when resolving the live peer url', () => {
    it('should return the env value when set', () => {
      expect(getLivePeerUrl()).toBe('https://peer.test')
    })

    it('should fall back to the prod peer when the env key is missing', () => {
      mockEnvValues.PEER_URL = undefined
      expect(getLivePeerUrl()).toBe('https://peer.decentraland.org')
    })
  })

  describe('when fetching the scene adapter for a world', () => {
    beforeEach(() => {
      mockSignedFetch.mockResolvedValue(jsonResponse({ adapter: 'livekit:wss://livekit.test/rtc?access_token=jwt-123' }))
    })

    it('should parse the livekit adapter envelope into url + token', async () => {
      const result = await fetchSceneAdapter({ worldName: 'MyWorld.dcl.eth', identity: userIdentity })

      expect(result).toEqual({ url: 'wss://livekit.test/rtc', token: 'jwt-123' })
    })

    it('should sign the gatekeeper request with the lowercased world as sceneId and realm', async () => {
      await fetchSceneAdapter({ worldName: 'MyWorld.dcl.eth', identity: userIdentity })

      expect(mockSignedFetch).toHaveBeenCalledWith(
        'https://gatekeeper.test/get-scene-adapter',
        expect.objectContaining({
          method: 'POST',
          identity: userIdentity,
          metadata: { sceneId: 'myworld.dcl.eth', parcel: '0,0', realmName: 'myworld.dcl.eth', signer: 'decentraland-kernel-scene' }
        })
      )
    })

    it('should prefer the explicit sceneId and parcel for multi-scene worlds', async () => {
      await fetchSceneAdapter({ worldName: 'MyWorld.dcl.eth', sceneId: 'bafyentity', parcel: '4,2', identity: userIdentity })

      expect(mockSignedFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadata: expect.objectContaining({ sceneId: 'bafyentity', parcel: '4,2', realmName: 'myworld.dcl.eth' })
        })
      )
    })

    it('should mint a guest identity when the caller has none', async () => {
      await fetchSceneAdapter({ worldName: 'myworld.dcl.eth' })

      expect(mockGetGuestIdentity).toHaveBeenCalledTimes(1)
      expect(mockSignedFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ identity: guestIdentity }))
    })

    it('should not mint a guest identity when the caller identity is present', async () => {
      await fetchSceneAdapter({ worldName: 'myworld.dcl.eth', identity: userIdentity })

      expect(mockGetGuestIdentity).not.toHaveBeenCalled()
    })

    it('should return null when the gatekeeper rejects the request', async () => {
      mockSignedFetch.mockResolvedValue(jsonResponse({}, false, 403))

      expect(await fetchSceneAdapter({ worldName: 'myworld.dcl.eth' })).toBeNull()
    })

    it('should return null when the body carries no adapter', async () => {
      mockSignedFetch.mockResolvedValue(jsonResponse({}))

      expect(await fetchSceneAdapter({ worldName: 'myworld.dcl.eth' })).toBeNull()
    })

    it('should return null when the adapter has no access token', async () => {
      mockSignedFetch.mockResolvedValue(jsonResponse({ adapter: 'livekit:wss://livekit.test/rtc' }))

      expect(await fetchSceneAdapter({ worldName: 'myworld.dcl.eth' })).toBeNull()
    })

    it('should return null when the adapter is not a parseable url', async () => {
      mockSignedFetch.mockResolvedValue(jsonResponse({ adapter: 'livekit:not a url at all' }))

      expect(await fetchSceneAdapter({ worldName: 'myworld.dcl.eth' })).toBeNull()
    })

    it('should return null instead of throwing when the signed fetch rejects', async () => {
      mockSignedFetch.mockRejectedValue(new Error('network down'))

      expect(await fetchSceneAdapter({ worldName: 'myworld.dcl.eth' })).toBeNull()
      expect(warnSpy).toHaveBeenCalled()
    })
  })

  describe('when fetching the scene adapter for a Genesis City parcel', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(jsonResponse([{ id: 'bafyscene' }]))
      mockSignedFetch.mockResolvedValue(jsonResponse({ adapter: 'livekit:wss://livekit.test/rtc?access_token=jwt-9' }))
    })

    it('should resolve the sceneId from the catalyst active-entities endpoint', async () => {
      const result = await fetchSceneAdapter({ parcel: '-3,-2' })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://peer.test/content/entities/active',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ pointers: ['-3,-2'] }) })
      )
      expect(mockSignedFetch).toHaveBeenCalledWith(
        'https://gatekeeper.test/get-scene-adapter',
        expect.objectContaining({
          metadata: expect.objectContaining({ sceneId: 'bafyscene', parcel: '-3,-2', realmName: 'main' })
        })
      )
      expect(result).toEqual({ url: 'wss://livekit.test/rtc', token: 'jwt-9' })
    })

    it('should return null without hitting the gatekeeper when the catalyst has no active entity', async () => {
      fetchMock.mockResolvedValue(jsonResponse([]))

      expect(await fetchSceneAdapter({ parcel: '-3,-2' })).toBeNull()
      expect(mockSignedFetch).not.toHaveBeenCalled()
    })

    it('should return null when the catalyst lookup fails', async () => {
      fetchMock.mockResolvedValue(jsonResponse(null, false, 500))

      expect(await fetchSceneAdapter({ parcel: '-3,-2' })).toBeNull()
    })

    it('should return null when the catalyst lookup throws', async () => {
      fetchMock.mockRejectedValue(new Error('offline'))

      expect(await fetchSceneAdapter({ parcel: '-3,-2' })).toBeNull()
      expect(warnSpy).toHaveBeenCalled()
    })
  })

  describe('when neither a world nor a parcel is provided', () => {
    it('should return null without any network call', async () => {
      expect(await fetchSceneAdapter({})).toBeNull()
      expect(mockSignedFetch).not.toHaveBeenCalled()
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('when listing world scenes', () => {
    it('should hit the lowercased, encoded world scenes endpoint', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ scenes: [] }))

      await fetchWorldScenes('My World.eth')

      expect(fetchMock).toHaveBeenCalledWith('https://worlds.test/world/my%20world.eth/scenes')
    })

    it('should map entities to entityId + title + base parcel', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse({
          scenes: [
            { entityId: 'bafyA', entity: { metadata: { display: { title: 'Main Plaza' }, scene: { base: '1,1' } } } },
            { entityId: 'bafyBackupTitle', entity: { metadata: {} }, parcels: ['7,7'] },
            { entityId: 'bafyNoBaseNoParcels' }
          ]
        })
      )

      const scenes = await fetchWorldScenes('myworld.eth')

      expect(scenes).toEqual([
        { entityId: 'bafyA', title: 'Main Plaza', base: '1,1' },
        { entityId: 'bafyBackupTitle', title: 'bafyBack', base: '7,7' },
        { entityId: 'bafyNoBaseNoParcels', title: 'bafyNoBa', base: '0,0' }
      ])
    })

    it('should return an empty list when the body has no scenes', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}))

      expect(await fetchWorldScenes('myworld.eth')).toEqual([])
    })

    it('should return null on a non-ok response so callers can tell an outage from an empty world', async () => {
      fetchMock.mockResolvedValue(jsonResponse(null, false, 404))

      expect(await fetchWorldScenes('myworld.eth')).toBeNull()
      expect(warnSpy).toHaveBeenCalled()
    })

    it('should return null when the request throws', async () => {
      fetchMock.mockRejectedValue(new Error('offline'))

      expect(await fetchWorldScenes('myworld.eth')).toBeNull()
      expect(warnSpy).toHaveBeenCalled()
    })
  })

  describe('when requesting a cast watcher token', () => {
    it('should POST the location + identity (+ parcel when given) to the gatekeeper', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ url: 'wss://cast.test', token: 'cast-token' }))

      const result = await fetchCastWatcherToken({ location: 'myworld.eth', identity: 'watcher-1', parcel: '1,2' })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://gatekeeper.test/cast/watcher-token',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ location: 'myworld.eth', identity: 'watcher-1', parcel: '1,2' }) })
      )
      expect(result).toEqual({ url: 'wss://cast.test', token: 'cast-token' })
    })

    it('should omit the parcel from the body when not provided', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ url: 'wss://cast.test', token: 'cast-token' }))

      await fetchCastWatcherToken({ location: '-3,-2', identity: 'watcher-1' })

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: JSON.stringify({ location: '-3,-2', identity: 'watcher-1' }) })
      )
    })

    it('should fall back to the prod gatekeeper when the env key is missing', async () => {
      mockEnvValues.GATEKEEPER_URL = undefined
      fetchMock.mockResolvedValue(jsonResponse({ url: 'wss://cast.test', token: 'cast-token' }))

      await fetchCastWatcherToken({ location: '-3,-2', identity: 'watcher-1' })

      expect(fetchMock).toHaveBeenCalledWith('https://comms-gatekeeper.decentraland.org/cast/watcher-token', expect.any(Object))
    })

    it('should return null on a non-ok response', async () => {
      fetchMock.mockResolvedValue(jsonResponse(null, false, 401))

      expect(await fetchCastWatcherToken({ location: '-3,-2', identity: 'watcher-1' })).toBeNull()
    })

    it('should return null when the body is missing url or token', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ url: 'wss://cast.test' }))

      expect(await fetchCastWatcherToken({ location: '-3,-2', identity: 'watcher-1' })).toBeNull()
    })

    it('should return null when the request throws', async () => {
      fetchMock.mockRejectedValue(new Error('offline'))

      expect(await fetchCastWatcherToken({ location: '-3,-2', identity: 'watcher-1' })).toBeNull()
      expect(infoSpy).toHaveBeenCalled()
    })
  })
})
