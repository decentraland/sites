import { configureStore } from '@reduxjs/toolkit'
import { getEnv } from '../../config/env'
import { jumpClient } from './jump.client'

jest.mock('../../config/env')

const mockGetEnv = jest.mocked(getEnv)

function createTestStore() {
  return configureStore({
    reducer: {
      [jumpClient.reducerPath]: jumpClient.reducer
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(jumpClient.middleware)
  })
}

describe('jumpClient', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch')
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
        const result = await store.dispatch(jumpClient.endpoints.getJumpPlaces.initiate({ position: [10, 20] }))

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
        await store.dispatch(jumpClient.endpoints.getJumpPlaces.initiate({ realm: 'Cool.DCL.eth' }))

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
        const result = await store.dispatch(jumpClient.endpoints.getJumpPlaces.initiate({ position: [0, 0] }))

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
        const result = await store.dispatch(jumpClient.endpoints.getJumpPlaces.initiate({ position: [0, 0] }))

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
        const result = await store.dispatch(jumpClient.endpoints.getJumpPlaces.initiate({ position: [0, 0] }))

        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
      })
    })

    describe('and PLACES_API_URL is not set', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue(undefined)
      })

      it('should return an error without crashing the store', async () => {
        const store = createTestStore()
        const result = await store.dispatch(jumpClient.endpoints.getJumpPlaces.initiate({ position: [0, 0] }))

        expect(result.error).toEqual(expect.objectContaining({ status: 'FETCH_ERROR' }))
      })
    })
  })

  describe('when getJumpEvents endpoint is called', () => {
    describe('and a position is provided', () => {
      beforeEach(() => {
        mockGetEnv.mockImplementation(key => (key === 'EVENTS_API_URL' ? 'https://events.test/api' : undefined))
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: [] })
        } as unknown as Response)
      })

      it('should call the events endpoint with position query', async () => {
        const store = createTestStore()
        await store.dispatch(jumpClient.endpoints.getJumpEvents.initiate({ position: [5, 5] }))

        expect(fetchSpy).toHaveBeenCalledWith('https://events.test/api/events?position=5%2C5')
      })
    })

    describe('and a realm is provided', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        fetchSpy.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ok: true, data: [] }) } as unknown as Response)
      })

      it('should append world_names[] to the query string', async () => {
        const store = createTestStore()
        await store.dispatch(jumpClient.endpoints.getJumpEvents.initiate({ realm: 'cool.dcl.eth' }))

        expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('world_names%5B%5D=cool.dcl.eth'))
      })
    })

    describe('and the API returns a 5xx', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: () => Promise.resolve('Service unavailable')
        } as unknown as Response)
      })

      it('should surface the numeric HTTP status', async () => {
        const store = createTestStore()
        const result = await store.dispatch(jumpClient.endpoints.getJumpEvents.initiate({ position: [0, 0] }))

        expect(result.error).toEqual(expect.objectContaining({ status: 503 }))
      })
    })
  })

  describe('when getJumpEventById endpoint is called', () => {
    describe('and the event exists', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ ok: true, data: { id: 'ev-1' } })
        } as unknown as Response)
      })

      it('should return the event payload', async () => {
        const store = createTestStore()
        const result = await store.dispatch(jumpClient.endpoints.getJumpEventById.initiate({ id: 'ev-1' }))

        expect(result.data).toEqual({ id: 'ev-1' })
      })
    })

    describe('and the event is not found', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        fetchSpy.mockResolvedValueOnce({ ok: false, status: 404 } as unknown as Response)
      })

      it('should return null instead of an error', async () => {
        const store = createTestStore()
        const result = await store.dispatch(jumpClient.endpoints.getJumpEventById.initiate({ id: 'missing' }))

        expect(result.data).toBeNull()
      })
    })

    describe('and the API returns a non-404 error', () => {
      beforeEach(() => {
        mockGetEnv.mockReturnValue('https://events.test/api')
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Server error')
        } as unknown as Response)
      })

      it('should surface the numeric HTTP status so transient errors are distinguishable from 4xx', async () => {
        const store = createTestStore()
        const result = await store.dispatch(jumpClient.endpoints.getJumpEventById.initiate({ id: 'ev-1' }))

        expect(result.error).toEqual(expect.objectContaining({ status: 500 }))
      })
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
        const result = await store.dispatch(jumpClient.endpoints.getSceneMetadata.initiate({ position: '10,20' }))

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
        const result = await store.dispatch(jumpClient.endpoints.getSceneMetadata.initiate({ position: '0,0' }))

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
        const result = await store.dispatch(jumpClient.endpoints.getSceneMetadata.initiate({ position: '0,0' }))

        expect(result.data).toBeNull()
      })
    })
  })
})
