import { configureStore } from '@reduxjs/toolkit'
import type { AuthIdentity } from '@dcl/crypto'
import { getEnv } from '../../config/env'
import { placesEndpoints } from './places.client'

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
  })
})
