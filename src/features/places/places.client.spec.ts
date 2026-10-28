import { configureStore } from '@reduxjs/toolkit'
import type { AuthIdentity } from '@dcl/crypto'
import { getEnv } from '../../config/env'
import { isWorldNotFoundError, placesEndpoints } from './places.client'

jest.mock('../../config/env')

const mockGetEnv = jest.mocked(getEnv)

const mockFetchWithOptionalIdentity = jest.fn()
jest.mock('../../utils/signedFetch', () => ({
  fetchWithOptionalIdentity: (...args: unknown[]) => mockFetchWithOptionalIdentity(...args)
}))

const mockLocalStorageGetIdentity = jest.fn()
jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: (...args: unknown[]) => mockLocalStorageGetIdentity(...args)
}))

// Poll a condition instead of waiting for a fixed delay, so the test doesn't
// flake on slow CI.
async function waitForCondition(check: () => boolean, timeoutMs = 1000): Promise<void> {
  const startedAt = Date.now()
  while (!check()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error(`waitForCondition timed out after ${timeoutMs}ms`)
    }
    await new Promise(resolve => setTimeout(resolve, 5))
  }
}

function createTestStore() {
  return configureStore({
    reducer: {
      [placesEndpoints.reducerPath]: placesEndpoints.reducer
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(placesEndpoints.middleware)
  })
}

describe('placesEndpoints', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch')
    mockFetchWithOptionalIdentity.mockReset()
    mockLocalStorageGetIdentity.mockReset()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('when getJumpPlaces endpoint is called', () => {
    describe('and a position is provided', () => {
      beforeEach(() => {
        mockGetEnv.mockImplementation(key => (key === 'PLACES_API_URL' ? 'https://places.test/api' : undefined))
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              ok: true,
              data: [{ id: 'p1', title: 'Test', base_position: '10,20', owner: null, image: '', description: '', positions: [] }]
            })
        } as unknown as Response)
      })

      it('should call the places endpoint with position query', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getJumpPlaces.initiate({ position: [10, 20] }))

        expect(fetchSpy).toHaveBeenCalledWith('https://places.test/api/places?positions=10,20')
        expect(result.data).toHaveLength(1)
      })
    })

    describe('and an ENS realm is provided', () => {
      beforeEach(() => {
        mockGetEnv.mockImplementation(key => (key === 'PLACES_API_URL' ? 'https://places.test/api' : undefined))
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [] })
        } as unknown as Response)
      })

      it('should call the worlds endpoint with lowercased name', async () => {
        const store = createTestStore()
        await store.dispatch(placesEndpoints.endpoints.getJumpPlaces.initiate({ realm: 'Cool.DCL.eth' }))

        expect(fetchSpy).toHaveBeenCalledWith('https://places.test/api/worlds?names=cool.dcl.eth')
      })
    })

    describe('and an ENS realm with an explicit position is provided', () => {
      // The /places scene record carries a contaminated user_count (the Genesis
      // City parcel's occupancy); /worlds carries the World's real count. The
      // scene fetch is always the first call, so it's queued in the parent
      // beforeEach; each child queues only its distinct /worlds response next.
      beforeEach(() => {
        mockGetEnv.mockImplementation(key => (key === 'PLACES_API_URL' ? 'https://places.test/api' : undefined))
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              ok: true,
              data: [
                {
                  id: 'arena',
                  title: 'Arena',
                  base_position: '10,20',
                  owner: null,
                  image: '',
                  description: '',
                  positions: ['10,20', '11,20'],
                  world: true,
                  world_name: 'cool.dcl.eth',
                  user_count: 99
                }
              ]
            })
        } as unknown as Response)
      })

      describe('and the /worlds lookup resolves the World record', () => {
        beforeEach(() => {
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: () =>
              Promise.resolve({ ok: true, data: [{ id: 'cool.dcl.eth', world: true, world_name: 'cool.dcl.eth', user_count: 2 }] })
          } as unknown as Response)
        })

        it('should query the World scene by name AND position so the API returns only the matching scene', async () => {
          const store = createTestStore()
          await store.dispatch(placesEndpoints.endpoints.getJumpPlaces.initiate({ realm: 'Cool.DCL.eth', position: [10, 20] }))

          expect(fetchSpy).toHaveBeenCalledWith('https://places.test/api/places?names=cool.dcl.eth&positions=10,20')
        })

        it('should return the scene the server resolved for that position', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getJumpPlaces.initiate({ realm: 'cool.dcl.eth', position: [10, 20] })
          )

          expect(result.data?.[0]).toEqual(expect.objectContaining({ id: 'arena' }))
        })

        it('should also query /worlds with the lowercased name to read the reliable occupancy', async () => {
          const store = createTestStore()
          await store.dispatch(placesEndpoints.endpoints.getJumpPlaces.initiate({ realm: 'Cool.DCL.eth', position: [10, 20] }))

          expect(fetchSpy).toHaveBeenCalledWith('https://places.test/api/worlds?names=cool.dcl.eth')
        })

        it('should overlay the /worlds user_count so the card shows the World occupancy, not the Genesis City parcel count', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getJumpPlaces.initiate({ realm: 'cool.dcl.eth', position: [10, 20] })
          )

          expect(result.data?.[0].user_count).toBe(2)
        })
      })

      describe('and the /worlds lookup reports zero users (the user is alone)', () => {
        beforeEach(() => {
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: () =>
              Promise.resolve({ ok: true, data: [{ id: 'cool.dcl.eth', world: true, world_name: 'cool.dcl.eth', user_count: 0 }] })
          } as unknown as Response)
        })

        it('should overlay the zero count instead of leaving the contaminated value', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getJumpPlaces.initiate({ realm: 'cool.dcl.eth', position: [10, 20] })
          )

          expect(result.data?.[0].user_count).toBe(0)
        })
      })

      describe('and the /worlds lookup fails', () => {
        beforeEach(() => {
          fetchSpy.mockRejectedValueOnce(new Error('worlds down'))
        })

        it('should keep the scene record and not crash the query', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getJumpPlaces.initiate({ realm: 'cool.dcl.eth', position: [10, 20] })
          )

          expect(result.data?.[0]).toEqual(expect.objectContaining({ id: 'arena', user_count: 99 }))
        })
      })

      describe('and the /worlds lookup returns a non-OK response', () => {
        beforeEach(() => {
          fetchSpy.mockResolvedValueOnce({ ok: false, status: 503 } as unknown as Response)
        })

        it('should fall back to the scene record value rather than overriding with undefined', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getJumpPlaces.initiate({ realm: 'cool.dcl.eth', position: [10, 20] })
          )

          expect(result.data?.[0].user_count).toBe(99)
        })
      })

      describe('and the /worlds lookup returns no record', () => {
        beforeEach(() => {
          fetchSpy.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true, data: [] }) } as unknown as Response)
        })

        it('should keep the scene record value', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getJumpPlaces.initiate({ realm: 'cool.dcl.eth', position: [10, 20] })
          )

          expect(result.data?.[0].user_count).toBe(99)
        })
      })
    })

    describe('and the API returns a 5xx', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://places.test/api')
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 502,
          text: () => Promise.resolve('Bad gateway')
        } as unknown as Response)
      })

      it('should surface the numeric HTTP status so transient errors are distinguishable from 4xx', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getJumpPlaces.initiate({ position: [0, 0] }))

        expect(result.error).toEqual(expect.objectContaining({ status: 502 }))
      })
    })

    describe('and the API returns a 404 for an unknown place', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://places.test/api')
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: () => Promise.resolve('not found')
        } as unknown as Response)
      })

      it('should surface 404 as numeric status so deep-link consumers can drop the broken URL', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getJumpPlaces.initiate({ position: [0, 0] }))

        expect(result.error).toEqual(expect.objectContaining({ status: 404 }))
      })
    })

    describe('and fetch itself rejects (network error)', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://places.test/api')
        fetchSpy.mockRejectedValueOnce(new Error('network down'))
      })

      it('should surface FETCH_ERROR so a transient blip does not look like a 4xx', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getJumpPlaces.initiate({ position: [0, 0] }))

        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
      })
    })

    describe('and PLACES_API_URL is not set', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue(undefined)
      })

      it('should return an error without crashing the store', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getJumpPlaces.initiate({ position: [0, 0] }))

        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
      })
    })
  })

  describe('when getJumpEvents endpoint is called', () => {
    describe('and a position is provided without identity', () => {
      beforeEach(() => {
        mockGetEnv.mockImplementation(key => (key === 'EVENTS_API_URL' ? 'https://events.test/api' : undefined))
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [] })
        } as unknown as Response)
      })

      it('should call the events endpoint anonymously with position query', async () => {
        const store = createTestStore()
        await store.dispatch(placesEndpoints.endpoints.getJumpEvents.initiate({ position: [5, 5] }))

        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(
          'https://events.test/api/events?position=5%2C5',
          undefined,
          expect.any(AbortSignal)
        )
      })
    })

    describe('and a realm is provided', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [] })
        } as unknown as Response)
      })

      it('should append world_names[] to the query string', async () => {
        const store = createTestStore()
        await store.dispatch(placesEndpoints.endpoints.getJumpEvents.initiate({ realm: 'cool.dcl.eth' }))

        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(
          expect.stringContaining('world_names%5B%5D=cool.dcl.eth'),
          undefined,
          expect.any(AbortSignal)
        )
      })
    })

    describe('and an address is provided', () => {
      const identity = { authChain: [], expiration: new Date(), ephemeralIdentity: {} } as unknown as AuthIdentity
      const address = '0xABCDEF0123456789ABCDEF0123456789ABCDEF01'

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        mockLocalStorageGetIdentity.mockReturnValue(identity)
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [{ id: 'ev-1', attending: true, total_attendees: 3 }] })
        } as unknown as Response)
      })

      it('should resolve the identity from localStorage with the lowercased address and forward it to fetchWithOptionalIdentity', async () => {
        const store = createTestStore()
        await store.dispatch(placesEndpoints.endpoints.getJumpEvents.initiate({ position: [0, 0], address }))

        expect(mockLocalStorageGetIdentity).toHaveBeenCalledWith(address.toLowerCase())
        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(
          expect.stringContaining('events?position=0%2C0'),
          identity,
          expect.any(AbortSignal)
        )
      })

      it('should keep the resolved identity out of the stored query args', async () => {
        const store = createTestStore()
        await store.dispatch(placesEndpoints.endpoints.getJumpEvents.initiate({ position: [0, 0], address }))

        const state = store.getState() as { placesClient: { queries: Record<string, { originalArgs: unknown }> } }
        const stored = Object.values(state.placesClient.queries)[0]?.originalArgs
        expect(stored).toEqual({ position: [0, 0], address })
      })
    })

    describe('and the API returns a 5xx', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: () => Promise.resolve('Service unavailable')
        } as unknown as Response)
      })

      it('should surface the numeric HTTP status', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getJumpEvents.initiate({ position: [0, 0] }))

        expect(result.error).toEqual(expect.objectContaining({ status: 503 }))
      })
    })
  })

  describe('when getJumpEventById endpoint is called', () => {
    describe('and the event exists', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: { id: 'ev-1' } })
        } as unknown as Response)
      })

      it('should return the event payload', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getJumpEventById.initiate({ id: 'ev-1' }))

        expect(result.data).toEqual({ id: 'ev-1' })
      })
    })

    describe('and an address is provided', () => {
      const identity = { authChain: [], expiration: new Date(), ephemeralIdentity: {} } as unknown as AuthIdentity
      const address = '0xABCDEF0123456789ABCDEF0123456789ABCDEF01'

      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        mockLocalStorageGetIdentity.mockReturnValue(identity)
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: { id: 'ev-1', attending: true } })
        } as unknown as Response)
      })

      it('should resolve the identity from localStorage and forward it so `attending` survives a page refresh after the user toggled remind-me', async () => {
        const store = createTestStore()
        await store.dispatch(placesEndpoints.endpoints.getJumpEventById.initiate({ id: 'ev-1', address }))

        expect(mockLocalStorageGetIdentity).toHaveBeenCalledWith(address.toLowerCase())
        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith('https://events.test/api/events/ev-1', identity, expect.any(AbortSignal))
      })
    })

    describe('and the event is not found', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({ ok: false, status: 404 } as unknown as Response)
      })

      it('should return null instead of an error', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getJumpEventById.initiate({ id: 'missing' }))

        expect(result.data).toBeNull()
      })
    })

    describe('and the API returns a non-404 error', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        mockFetchWithOptionalIdentity.mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Server error')
        } as unknown as Response)
      })

      it('should surface the numeric HTTP status so transient errors are distinguishable from 4xx', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getJumpEventById.initiate({ id: 'ev-1' }))

        expect(result.error).toEqual(expect.objectContaining({ status: 500 }))
      })
    })
  })

  describe('when the JumpEvent tag is invalidated after a remind-me toggle', () => {
    const identity = { authChain: [], expiration: new Date(), ephemeralIdentity: {} } as unknown as AuthIdentity
    const address = '0xABCDEF0123456789ABCDEF0123456789ABCDEF01'

    beforeEach(() => {
      mockGetEnv.mockReturnValue('https://events.test/api')
      mockLocalStorageGetIdentity.mockReturnValue(identity)
    })

    it('should refetch getJumpEvents so the bell-badge total_attendees reflects the toggle', async () => {
      mockFetchWithOptionalIdentity
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [{ id: 'ev-1', attending: false, total_attendees: 4 }] })
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [{ id: 'ev-1', attending: true, total_attendees: 5 }] })
        } as unknown as Response)

      const store = createTestStore()
      const subscription = store.dispatch(placesEndpoints.endpoints.getJumpEvents.initiate({ position: [0, 0], address }))
      await subscription
      store.dispatch(placesEndpoints.util.invalidateTags(['JumpEvent']))
      await waitForCondition(() => mockFetchWithOptionalIdentity.mock.calls.length >= 2)

      expect(mockFetchWithOptionalIdentity).toHaveBeenCalledTimes(2)
      subscription.unsubscribe()
    })

    it('should refetch getJumpEventById so `attending` reflects the toggle', async () => {
      mockFetchWithOptionalIdentity
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: { id: 'ev-1', attending: false } })
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: { id: 'ev-1', attending: true } })
        } as unknown as Response)

      const store = createTestStore()
      const subscription = store.dispatch(placesEndpoints.endpoints.getJumpEventById.initiate({ id: 'ev-1', address }))
      await subscription
      // Mirrors EventsPage.tsx, which invalidates by tag type (not by id).
      store.dispatch(placesEndpoints.util.invalidateTags(['JumpEvent']))
      await waitForCondition(() => mockFetchWithOptionalIdentity.mock.calls.length >= 2)

      expect(mockFetchWithOptionalIdentity).toHaveBeenCalledTimes(2)
      subscription.unsubscribe()
    })
  })

  describe('when getSceneMetadata endpoint is called', () => {
    describe('and the peer returns the full 3-step chain', () => {
      beforeEach(() => {
        mockGetEnv.mockImplementation(key => (key === 'PEER_URL' ? 'https://peer.test' : undefined))
        fetchSpy
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([{ id: 'entity-1' }])
          } as unknown as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ deployments: [{ entityId: 'entity-1', deployedBy: '0xDeployer', metadata: {} }] })
          } as unknown as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  timestamp: 0,
                  avatars: [
                    {
                      name: 'Deployer Name',
                      userId: '0xDeployer',
                      avatar: { snapshots: { face256: 'avatar.png', body: 'body.png' } }
                    }
                  ]
                }
              ])
          } as unknown as Response)
      })

      it('should return the aggregated deployer info', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '10,20' }))

        expect(result.data).toEqual({
          deployerAddress: '0xDeployer',
          deployerName: 'Deployer Name',
          deployerAvatar: 'avatar.png'
        })
      })
    })

    describe('and the peer returns no entities', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://peer.test')
        fetchSpy.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as unknown as Response)
      })

      it('should return null without error', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0' }))

        expect(result.data).toBeNull()
      })
    })

    describe('and the deployment endpoint returns 404', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://peer.test')
        fetchSpy
          .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ id: 'entity-1' }]) } as unknown as Response)
          .mockResolvedValueOnce({ ok: false } as unknown as Response)
      })

      it('should return null when the deployment lookup fails', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0' }))
        expect(result.data).toBeNull()
      })
    })

    describe('and the active-entities endpoint returns a server error', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://peer.test')
        fetchSpy.mockResolvedValueOnce({ ok: false } as unknown as Response)
      })

      it('should return null without crashing', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0' }))
        expect(result.data).toBeNull()
      })
    })

    describe('and PEER_URL is not set', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue(undefined)
      })

      it('should surface FETCH_ERROR', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0' }))
        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
      })
    })

    describe('and the deployments fetch is missing the deployments array', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://peer.test')
        fetchSpy
          .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ id: 'entity-1' }]) } as unknown as Response)
          .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) } as unknown as Response)
      })

      it('should return null when deployments are missing', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0' }))
        expect(result.data).toBeNull()
      })
    })

    describe('and the deployer has no Catalyst profile', () => {
      beforeEach(() => {
        mockGetEnv.mockImplementation(key => (key === 'PEER_URL' ? 'https://peer.test' : undefined))
        fetchSpy
          .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([{ id: 'entity-1' }]) } as unknown as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ deployments: [{ entityId: 'entity-1', deployedBy: '0xFoundation' }] })
          } as unknown as Response)
          .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as unknown as Response)
      })

      it('should return null so the Places API contact_name is not overridden by a placeholder', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0' }))

        expect(result.data).toBeNull()
      })
    })

    describe('and the realm is a World (ENS name)', () => {
      const mockWorldsAndPeer = (key: string) => {
        if (key === 'WORLDS_CONTENT_SERVER_URL') return 'https://worlds.test'
        if (key === 'PEER_URL') return 'https://peer.test'
        return undefined
      }

      describe('and the world scene entity exposes an owner with a Catalyst profile', () => {
        beforeEach(() => {
          mockGetEnv.mockImplementation(mockWorldsAndPeer)
          fetchSpy
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve([{ id: 'world-entity', metadata: { owner: '0xOwner' } }])
            } as unknown as Response)
            .mockResolvedValueOnce({
              ok: true,
              json: () =>
                Promise.resolve([
                  {
                    timestamp: 0,
                    avatars: [
                      {
                        name: 'Chiri',
                        userId: '0xOwner',
                        avatar: { snapshots: { face256: 'owner.png', body: 'body.png' } }
                      }
                    ]
                  }
                ])
            } as unknown as Response)
        })

        it('should resolve the owner profile from the Worlds Content Server scene entity', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '25,4', realm: 'MyWorld.dcl.eth' })
          )

          expect(fetchSpy).toHaveBeenCalledWith(
            'https://worlds.test/entities/active',
            expect.objectContaining({ method: 'POST', body: JSON.stringify({ pointers: ['myworld.dcl.eth'] }) })
          )
          expect(result.data).toEqual({
            deployerAddress: '0xOwner',
            deployerName: 'Chiri',
            deployerAvatar: 'owner.png'
          })
        })

        it('should not query the main Catalyst active-entities endpoint by position', async () => {
          // Drop call history accumulated by earlier suites so the assertion only
          // reflects this dispatch; the `mockResolvedValueOnce` queue survives.
          fetchSpy.mockClear()
          const store = createTestStore()
          await store.dispatch(placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '25,4', realm: 'myworld.dcl.eth' }))

          const calledUrls = fetchSpy.mock.calls.map(call => call[0])
          expect(calledUrls).toContain('https://worlds.test/entities/active')
          expect(calledUrls).not.toContain('https://peer.test/content/entities/active')
        })
      })

      describe('and the world has no active scene entity (server answered 200 with [])', () => {
        beforeEach(() => {
          mockGetEnv.mockImplementation(mockWorldsAndPeer)
          fetchSpy.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as unknown as Response)
        })

        it('should surface WORLD_NOT_FOUND so the page can treat the realm as an invalid jump', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0', realm: 'empty.dcl.eth' })
          )
          expect(result.error).toEqual(expect.objectContaining({ status: 'WORLD_NOT_FOUND' }))
        })
      })

      describe('and the world scene entity has no owner', () => {
        beforeEach(() => {
          mockGetEnv.mockImplementation(mockWorldsAndPeer)
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([{ id: 'world-entity', metadata: {} }])
          } as unknown as Response)
        })

        it('should return null', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0', realm: 'ownerless.dcl.eth' })
          )
          expect(result.data).toBeNull()
        })
      })

      describe('and the owner has no Catalyst profile', () => {
        beforeEach(() => {
          mockGetEnv.mockImplementation(mockWorldsAndPeer)
          fetchSpy
            .mockResolvedValueOnce({
              ok: true,
              json: () => Promise.resolve([{ id: 'world-entity', metadata: { owner: '0xOwner' } }])
            } as unknown as Response)
            .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) } as unknown as Response)
        })

        it('should return null so the Places API contact_name is used', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0', realm: 'noprofile.dcl.eth' })
          )
          expect(result.data).toBeNull()
        })
      })

      describe('and the Worlds Content Server returns a server error', () => {
        beforeEach(() => {
          mockGetEnv.mockImplementation(mockWorldsAndPeer)
          fetchSpy.mockResolvedValueOnce({ ok: false, status: 503 } as unknown as Response)
        })

        it('should surface FETCH_ERROR (not WORLD_NOT_FOUND) so an outage does not redirect valid worlds to invalid', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0', realm: 'down.dcl.eth' })
          )
          expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
        })
      })

      describe('and WORLDS_CONTENT_SERVER_URL is not set', () => {
        beforeEach(() => {
          mockGetEnv.mockImplementation(key => (key === 'PEER_URL' ? 'https://peer.test' : undefined))
        })

        it('should surface FETCH_ERROR', async () => {
          const store = createTestStore()
          const result = await store.dispatch(
            placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0', realm: 'noenv.dcl.eth' })
          )
          expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
        })
      })
    })
  })

  describe('getJumpPlaces with no position or realm', () => {
    beforeEach(() => {
      mockGetEnv.mockReturnValue('https://places.test/api')
      fetchSpy.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true, data: [] }) } as unknown as Response)
    })

    it('should hit the bare /places endpoint', async () => {
      const store = createTestStore()
      await store.dispatch(placesEndpoints.endpoints.getJumpPlaces.initiate({}))
      expect(fetchSpy).toHaveBeenCalledWith('https://places.test/api/places')
    })
  })

  describe('resolveIdentity error handling', () => {
    const address = '0xABCDEF0123456789ABCDEF0123456789ABCDEF01'

    beforeEach(() => {
      mockGetEnv.mockReturnValue('https://events.test/api')
      mockLocalStorageGetIdentity.mockImplementation(() => {
        throw new Error('storage corrupted')
      })
      mockFetchWithOptionalIdentity.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: [] })
      } as unknown as Response)
    })

    it('should swallow the localStorage failure and fall back to anonymous calls', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
      const store = createTestStore()
      await store.dispatch(placesEndpoints.endpoints.getJumpEvents.initiate({ position: [0, 0], address }))
      expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(expect.any(String), undefined, expect.any(AbortSignal))
      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('getJumpEvents catch path', () => {
    beforeEach(() => {
      mockGetEnv.mockReturnValue('https://events.test/api')
      mockFetchWithOptionalIdentity.mockRejectedValueOnce(new Error('network down'))
    })

    it('should surface FETCH_ERROR', async () => {
      const store = createTestStore()
      const result = await store.dispatch(placesEndpoints.endpoints.getJumpEvents.initiate({ position: [0, 0] }))
      expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
    })
  })

  describe('getJumpEventById catch path', () => {
    beforeEach(() => {
      mockGetEnv.mockReturnValue('https://events.test/api')
      mockFetchWithOptionalIdentity.mockRejectedValueOnce(new Error('boom'))
    })

    it('should surface FETCH_ERROR', async () => {
      const store = createTestStore()
      const result = await store.dispatch(placesEndpoints.endpoints.getJumpEventById.initiate({ id: 'ev-1' }))
      expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
    })
  })

  describe('getProfileCreator', () => {
    describe('and the profile has a name', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://peer.test')
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ avatars: [{ name: 'Creator Person', avatar: { snapshots: { face256: 'face.png' } } }] }])
        } as unknown as Response)
      })

      it('should return the mapped creator data', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getProfileCreator.initiate({ address: '0xabc' }))
        expect(result.data).toEqual({ user: '0xabc', user_name: 'Creator Person', avatar: 'face.png' })
      })
    })

    describe('and the profile only has realName', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://peer.test')
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ avatars: [{ realName: 'Real Name' }] }])
        } as unknown as Response)
      })

      it('should use realName as user_name', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getProfileCreator.initiate({ address: '0xabc' }))
        expect(result.data?.user_name).toBe('Real Name')
      })
    })

    describe('and the profile has no name fields', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://peer.test')
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ avatars: [{}] }])
        } as unknown as Response)
      })

      it('should return null', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getProfileCreator.initiate({ address: '0xabc' }))
        expect(result.data).toBeNull()
      })
    })

    describe('and the lambdas profiles endpoint responds not-ok', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://peer.test')
        fetchSpy.mockResolvedValueOnce({ ok: false, status: 503 } as unknown as Response)
      })

      it('should resolve to null because no profile could be fetched', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getProfileCreator.initiate({ address: '0xabc' }))
        expect(result.data).toBeNull()
      })
    })

    describe('and PEER_URL is not configured', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue(undefined)
      })

      it('should surface FETCH_ERROR', async () => {
        const store = createTestStore()
        const result = await store.dispatch(placesEndpoints.endpoints.getProfileCreator.initiate({ address: '0xabc' }))
        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
      })
    })
  })

  describe('non-Error rejection branch (`Unknown error` fallback)', () => {
    beforeEach(() => {
      mockGetEnv.mockReturnValue('https://places.test/api')
    })

    it.each([
      ['getJumpPlaces', () => placesEndpoints.endpoints.getJumpPlaces.initiate({ position: [0, 0] }), 'fetch'],
      ['getJumpEvents', () => placesEndpoints.endpoints.getJumpEvents.initiate({ position: [0, 0] }), 'identity'],
      ['getJumpEventById', () => placesEndpoints.endpoints.getJumpEventById.initiate({ id: 'e1' }), 'identity'],
      ['getSceneMetadata', () => placesEndpoints.endpoints.getSceneMetadata.initiate({ position: '0,0' }), 'fetch'],
      ['getProfileCreator', () => placesEndpoints.endpoints.getProfileCreator.initiate({ address: '0xabc' }), 'fetch']
    ] as const)(
      'should surface "Unknown error" for %s when the underlying fetch rejects with a non-Error',
      async (_name, dispatch, channel) => {
        if (channel === 'fetch') {
          fetchSpy.mockRejectedValue('plain-string')
        } else {
          mockFetchWithOptionalIdentity.mockRejectedValue('plain-string')
        }
        const store = createTestStore()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await store.dispatch(dispatch() as never)
        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR', error: 'Unknown error' }))
      }
    )
  })

  describe('when a not-ok response body cannot be read as text', () => {
    beforeEach(() => {
      mockGetEnv.mockReturnValue('https://places.test/api')
    })

    it('should fall back to null data for getJumpPlaces when response.text() rejects', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.reject(new Error('stream closed'))
      } as unknown as Response)
      const store = createTestStore()
      const result = await store.dispatch(placesEndpoints.endpoints.getJumpPlaces.initiate({ position: [0, 0] }))
      expect(result.error).toEqual(expect.objectContaining({ status: 500, data: null }))
    })

    it('should fall back to null data for getJumpEvents when response.text() rejects', async () => {
      mockFetchWithOptionalIdentity.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.reject(new Error('stream closed'))
      } as unknown as Response)
      const store = createTestStore()
      const result = await store.dispatch(placesEndpoints.endpoints.getJumpEvents.initiate({ position: [0, 0] }))
      expect(result.error).toEqual(expect.objectContaining({ status: 500, data: null }))
    })

    it('should fall back to null data for getJumpEventById when response.text() rejects on a non-404 error', async () => {
      mockFetchWithOptionalIdentity.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.reject(new Error('stream closed'))
      } as unknown as Response)
      const store = createTestStore()
      const result = await store.dispatch(placesEndpoints.endpoints.getJumpEventById.initiate({ id: 'e1' }))
      expect(result.error).toEqual(expect.objectContaining({ status: 500, data: null }))
    })
  })

  describe('isWorldNotFoundError', () => {
    it('should return true only for the typed WORLD_NOT_FOUND error shape', () => {
      expect(isWorldNotFoundError({ status: 'WORLD_NOT_FOUND' })).toBe(true)
    })

    it('should return false for other error shapes and primitives', () => {
      expect(isWorldNotFoundError({ status: 'FETCH_ERROR' })).toBe(false)
      expect(isWorldNotFoundError({ status: 404 })).toBe(false)
      expect(isWorldNotFoundError(null)).toBe(false)
      expect(isWorldNotFoundError(undefined)).toBe(false)
      expect(isWorldNotFoundError('WORLD_NOT_FOUND')).toBe(false)
    })
  })
})
