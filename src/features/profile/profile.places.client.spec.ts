import { configureStore } from '@reduxjs/toolkit'
import { getEnv } from '../../config/env'
import { resolveActiveIdentity } from '../../utils/activeIdentity'
import { profilePlacesApi } from './profile.places.client'

jest.mock('../../config/env')

const mockGetEnv = jest.mocked(getEnv)

const mockFetchWithIdentity = jest.fn()
jest.mock('../../utils/signedFetch', () => ({
  fetchWithIdentity: (...args: unknown[]) => mockFetchWithIdentity(...args)
}))

jest.mock('../../utils/activeIdentity', () => ({
  resolveActiveIdentity: jest.fn()
}))

const mockResolveActiveIdentity = jest.mocked(resolveActiveIdentity)

const ADDRESS = '0xa856e64368312ea05ab4ebf5634a093a8dddee2a'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body))
  } as unknown as Response
}

function createTestStore() {
  return configureStore({
    reducer: {
      [profilePlacesApi.reducerPath]: profilePlacesApi.reducer
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(profilePlacesApi.middleware)
  })
}

describe('profilePlacesApi', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    fetchSpy = jest.spyOn(global, 'fetch')
    mockGetEnv.mockImplementation(key => (key === 'PLACES_API_URL' ? 'https://places.test/api' : undefined))
  })

  afterEach(() => {
    jest.restoreAllMocks()
    mockFetchWithIdentity.mockReset()
    mockResolveActiveIdentity.mockReset()
  })

  describe('when getProfilePlaces is called', () => {
    describe('and both the places and worlds endpoints succeed', () => {
      beforeEach(() => {
        fetchSpy.mockImplementation((input: RequestInfo | URL) => {
          const url = String(input)
          if (url.includes('/worlds?owner=')) {
            return Promise.resolve(jsonResponse({ ok: true, total: 1, data: [{ id: 'w1', title: 'My World', world_name: 'my.dcl.eth' }] }))
          }
          return Promise.resolve(jsonResponse({ ok: true, total: 1, data: [{ id: 'p1', title: 'My Land', base_position: '10,20' }] }))
        })
      })

      it('should merge worlds first then places and sum the totals', async () => {
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfilePlaces.initiate({ address: ADDRESS }))

        expect(result.data?.data.map(place => place.id)).toEqual(['w1', 'p1'])
        expect(result.data?.data[0].world).toBe(true)
        expect(result.data?.total).toBe(2)
      })
    })

    describe('and the land places endpoint fails but the worlds endpoint succeeds', () => {
      beforeEach(() => {
        fetchSpy.mockImplementation((input: RequestInfo | URL) => {
          const url = String(input)
          if (url.includes('/worlds?owner=')) {
            return Promise.resolve(jsonResponse({ ok: true, total: 1, data: [{ id: 'w1', title: 'My World', world_name: 'my.dcl.eth' }] }))
          }
          return Promise.resolve(jsonResponse({ error: 'boom' }, false, 503))
        })
      })

      it('should still return the worlds instead of blanking the whole tab', async () => {
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfilePlaces.initiate({ address: ADDRESS }))

        expect(result.error).toBeUndefined()
        expect(result.data?.data.map(place => place.id)).toEqual(['w1'])
        expect(result.data?.total).toBe(1)
      })

      it('should log the failing endpoint for ops without surfacing the raw body', async () => {
        const store = createTestStore()

        await store.dispatch(profilePlacesApi.endpoints.getProfilePlaces.initiate({ address: ADDRESS }))

        expect(console.error).toHaveBeenCalledWith('[ProfilePlaces] /places failed', 503, expect.any(String))
      })
    })

    describe('and the worlds endpoint fails but the land places endpoint succeeds', () => {
      beforeEach(() => {
        fetchSpy.mockImplementation((input: RequestInfo | URL) => {
          const url = String(input)
          if (url.includes('/worlds?owner=')) {
            return Promise.resolve(jsonResponse({ error: 'boom' }, false, 500))
          }
          return Promise.resolve(jsonResponse({ ok: true, total: 1, data: [{ id: 'p1', title: 'My Land', base_position: '10,20' }] }))
        })
      })

      it('should still return the land places', async () => {
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfilePlaces.initiate({ address: ADDRESS }))

        expect(result.error).toBeUndefined()
        expect(result.data?.data.map(place => place.id)).toEqual(['p1'])
        expect(result.data?.total).toBe(1)
      })
    })

    describe('and the endpoints omit the total and data fields', () => {
      beforeEach(() => {
        fetchSpy.mockResolvedValue(jsonResponse({ ok: true }))
      })

      it('should default to an empty list and a zero total', async () => {
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfilePlaces.initiate({ address: ADDRESS }))

        expect(result.data?.data).toEqual([])
        expect(result.data?.total).toBe(0)
      })
    })

    describe('and both endpoints fail', () => {
      beforeEach(() => {
        fetchSpy.mockImplementation(() => Promise.resolve(jsonResponse({ error: 'boom' }, false, 503)))
      })

      it('should return an error', async () => {
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfilePlaces.initiate({ address: ADDRESS }))

        expect(result.error).toBeDefined()
        expect(result.data).toBeUndefined()
      })
    })

    describe('and a network request throws', () => {
      beforeEach(() => {
        fetchSpy.mockRejectedValue(new Error('network'))
      })

      it('should return a FETCH_ERROR', async () => {
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfilePlaces.initiate({ address: ADDRESS }))

        expect(result.error).toMatchObject({ status: 'FETCH_ERROR' })
      })
    })
  })

  describe('when getProfileFavoritePlaces is called', () => {
    describe('and there is no active identity', () => {
      beforeEach(() => {
        mockResolveActiveIdentity.mockReturnValue(undefined)
      })

      it('should return a 401 error', async () => {
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfileFavoritePlaces.initiate())

        expect(result.error).toMatchObject({ status: 401 })
      })
    })

    describe('and the favorite worlds endpoint fails but favorite places succeeds', () => {
      beforeEach(() => {
        mockResolveActiveIdentity.mockReturnValue({ authChain: [] } as never)
        mockFetchWithIdentity.mockImplementation((url: string) => {
          if (url.includes('/worlds?')) return Promise.resolve(jsonResponse({ error: 'boom' }, false, 500))
          return Promise.resolve(jsonResponse({ ok: true, total: 1, data: [{ id: 'fp1', title: 'Fav Land', base_position: '1,2' }] }))
        })
      })

      it('should still return the favorite places', async () => {
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfileFavoritePlaces.initiate())

        expect(result.error).toBeUndefined()
        expect(result.data?.data.map(place => place.id)).toEqual(['fp1'])
      })
    })

    describe('and the favorite places endpoint fails but favorite worlds succeeds', () => {
      beforeEach(() => {
        mockResolveActiveIdentity.mockReturnValue({ authChain: [] } as never)
        mockFetchWithIdentity.mockImplementation((url: string) => {
          if (url.includes('/worlds?')) {
            return Promise.resolve(
              jsonResponse({ ok: true, total: 1, data: [{ id: 'fw1', title: 'Fav World', world_name: 'fav.dcl.eth' }] })
            )
          }
          return Promise.resolve(jsonResponse({ error: 'boom' }, false, 500))
        })
      })

      it('should still return the favorite worlds', async () => {
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfileFavoritePlaces.initiate())

        expect(result.error).toBeUndefined()
        expect(result.data?.data.map(place => place.id)).toEqual(['fw1'])
      })
    })

    describe('and both favorite endpoints succeed', () => {
      beforeEach(() => {
        mockGetEnv.mockImplementation(key =>
          key === 'PLACES_API_URL' ? 'https://places.test/api' : key === 'PEER_URL' ? 'https://peer.test' : undefined
        )
        mockResolveActiveIdentity.mockReturnValue({ authChain: [] } as never)
        mockFetchWithIdentity.mockImplementation((url: string) => {
          if (url.includes('/worlds?')) {
            return Promise.resolve(
              jsonResponse({ ok: true, total: 1, data: [{ id: 'fw1', title: 'Fav World', world_name: 'fav.dcl.eth', owner: '0xOWNER' }] })
            )
          }
          return Promise.resolve(
            jsonResponse({ ok: true, total: 1, data: [{ id: 'fp1', title: 'Fav Land', base_position: '1,2', owner: '0xOWNER' }] })
          )
        })
      })

      it('should merge favourites and attach the batch-resolved owner avatar', async () => {
        fetchSpy.mockResolvedValue(jsonResponse([{ avatars: [{ ethAddress: '0xowner', name: 'Creator' }] }]))
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfileFavoritePlaces.initiate())

        expect(result.data?.data.map(place => place.id)).toEqual(['fw1', 'fp1'])
        expect(result.data?.data.every(place => place.owner_avatar?.name === 'Creator')).toBe(true)
        expect(fetchSpy).toHaveBeenCalledWith('https://peer.test/lambdas/profiles', expect.objectContaining({ method: 'POST' }))
      })

      it('should degrade to cards without the owner row when the avatar batch request fails', async () => {
        fetchSpy.mockResolvedValue(jsonResponse({}, false, 500))
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfileFavoritePlaces.initiate())

        expect(result.data?.data.map(place => place.id)).toEqual(['fw1', 'fp1'])
        expect(result.data?.data.every(place => place.owner_avatar === undefined)).toBe(true)
      })

      it('should degrade to cards without the owner row when the avatar batch throws', async () => {
        fetchSpy.mockRejectedValue(new Error('network'))
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfileFavoritePlaces.initiate())

        expect(result.error).toBeUndefined()
        expect(result.data?.data.map(place => place.id)).toEqual(['fw1', 'fp1'])
      })
    })

    describe('and both favorite endpoints fail', () => {
      beforeEach(() => {
        mockResolveActiveIdentity.mockReturnValue({ authChain: [] } as never)
        mockFetchWithIdentity.mockResolvedValue(jsonResponse({ error: 'boom' }, false, 503))
      })

      it('should return an error', async () => {
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfileFavoritePlaces.initiate())

        expect(result.error).toBeDefined()
        expect(result.data).toBeUndefined()
      })
    })

    describe('and a favorite request throws', () => {
      beforeEach(() => {
        mockResolveActiveIdentity.mockReturnValue({ authChain: [] } as never)
        mockFetchWithIdentity.mockRejectedValue(new Error('network'))
      })

      it('should return a FETCH_ERROR', async () => {
        const store = createTestStore()

        const result = await store.dispatch(profilePlacesApi.endpoints.getProfileFavoritePlaces.initiate())

        expect(result.error).toMatchObject({ status: 'FETCH_ERROR' })
      })
    })
  })
})
