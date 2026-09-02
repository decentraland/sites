/* eslint-disable import/order -- jest.mock stubs must sit between the infra
   imports and the client import so the module chain is stubbed before eval */
import { type ReactNode, createElement } from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { renderHook, waitFor } from '@testing-library/react'
import { placesClient } from '../../services/placesClient'
import { socialClient } from '../../services/socialClient'

const mockLocalStorageGetIdentity = jest.fn()
const mockFetchWithOptionalIdentity = jest.fn()
const mockResolveActiveIdentity = jest.fn()
// Mutable env map — tests can tweak per-key values without re-mocking.
const mockEnvValues: Record<string, string | undefined> = {}

// `socialClient` and the social endpoint file walk through a chain of
// modules — `decentraland-crypto-fetch` (needs browser fetch), `config/env`,
// and `@dcl/single-sign-on-client` (touches `localStorage` at import). Stub
// them so the spec only exercises the RTK Query layer + the queryFn bodies.
jest.mock('decentraland-crypto-fetch', () => ({
  __esModule: true,
  default: jest.fn(),
  signedFetchFactory: () => jest.fn()
}))
jest.mock('../../config/env', () => ({
  getEnv: (key: string) => mockEnvValues[key]
}))
jest.mock('@dcl/single-sign-on-client', () => ({
  localStorageGetIdentity: (...args: unknown[]) => mockLocalStorageGetIdentity(...args)
}))
jest.mock('../../utils/signedFetch', () => ({
  fetchWithOptionalIdentity: (...args: unknown[]) => mockFetchWithOptionalIdentity(...args)
}))
jest.mock('../../utils/activeIdentity', () => ({
  resolveActiveIdentity: () => mockResolveActiveIdentity()
}))
import {
  useGetCommunitiesListQuery,
  useGetDiscoverDestinationsQuery,
  useGetDiscoverFavoritesQuery,
  useGetDiscoverPlaceByPositionQuery,
  useGetDiscoverPlacesQuery,
  useGetDiscoverWorldByNameQuery,
  useGetDiscoverWorldsByNamesQuery,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery
} from './discover.client'
import type { DiscoverPlace } from './discover.types'
/* eslint-enable import/order */

function buildStore() {
  return configureStore({
    reducer: {
      [placesClient.reducerPath]: placesClient.reducer,
      [socialClient.reducerPath]: socialClient.reducer
    },
    middleware: getDefault => getDefault().concat(placesClient.middleware, socialClient.middleware)
  })
}

// Provider wrapper so the generated hooks drive the REAL injected queryFns —
// results are read back through the hook (never via client cache internals).
function renderQuery<T, P>(hook: (props: P) => T, initialProps?: P) {
  const store = buildStore()
  // react-redux's ProviderProps require `children` in the props object, so the
  // usual createElement third-argument form doesn't typecheck here.
  // eslint-disable-next-line react/no-children-prop
  const wrapper = ({ children }: { children?: ReactNode }) => createElement(Provider, { store, children })
  return renderHook(hook, { wrapper, initialProps })
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as unknown as Response
}

// Non-ok upstream whose body is ALSO unreadable — exercises the
// `.text().catch(() => null)` guard inside every logAndShape call site.
function unreadableErrorResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => {
      throw new Error('unreadable body')
    },
    text: async () => {
      throw new Error('unreadable body')
    }
  } as unknown as Response
}

function createPlace(overrides: Partial<DiscoverPlace> = {}): DiscoverPlace {
  return {
    id: 'place-1',
    title: 'Genesis Plaza',
    description: 'plaza',
    image: 'https://img.test/x.png',
    positions: ['-9,-9'],
    base_position: '-9,-9',
    owner: '0xabc',
    ...overrides
  }
}

// Side-effect import: the client file itself injects endpoints into
// `placesClient` and `socialClient` at module-eval time. Importing the
// hooks above triggers that injection, but we also assert it explicitly
// so a future refactor that splits the file can't silently drop endpoints.
describe('discover.client', () => {
  let fetchMock: jest.Mock
  let warnSpy: jest.SpyInstance

  beforeEach(() => {
    mockEnvValues.PLACES_API_URL = 'https://places.test/api'
    mockEnvValues.HOT_SCENES_URL = 'https://hot.test/hot-scenes'
    mockEnvValues.WORLDS_CONTENT_SERVER_URL = 'https://worlds.test'
    mockEnvValues.SOCIAL_API_URL = 'https://social.test'
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
    mockResolveActiveIdentity.mockReturnValue(undefined)
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    warnSpy.mockRestore()
    jest.resetAllMocks()
  })

  describe('when the store is built with the social-bearing base clients', () => {
    it('boots with both base clients' + ' reducerPath registered', () => {
      const store = buildStore()

      expect(store.getState()).toHaveProperty(placesClient.reducerPath)
      expect(store.getState()).toHaveProperty(socialClient.reducerPath)
    })
  })

  describe('when querying the injected endpoint registry', () => {
    it('exposes every places-tier endpoint the social pages consume', () => {
      // `injectEndpoints({overrideExisting:false})` patches the same `placesClient`
      // instance. The endpoints registry is the source of truth.
      expect(placesClient.endpoints).toHaveProperty('getDiscoverPlaces')
      expect(placesClient.endpoints).toHaveProperty('getDiscoverDestinations')
      expect(placesClient.endpoints).toHaveProperty('getDiscoverWorldsByNames')
      expect(placesClient.endpoints).toHaveProperty('getHotScenes')
      expect(placesClient.endpoints).toHaveProperty('getLiveWorlds')
      expect(placesClient.endpoints).toHaveProperty('getDiscoverPlaceByPosition')
      expect(placesClient.endpoints).toHaveProperty('getDiscoverWorldByName')
    })

    it('exposes the communities list endpoint on the social-api client', () => {
      expect(socialClient.endpoints).toHaveProperty('getCommunitiesList')
    })
  })

  describe('when callers import the generated hooks', () => {
    it('returns a defined hook for every endpoint exposed by the barrel', () => {
      // We treat the hook identities as opaque — only assert they exist and are
      // functions. RTK Query's generator builds these from endpoint names; if
      // any endpoint stops being injected the hook becomes undefined.
      expect(typeof useGetDiscoverPlacesQuery).toBe('function')
      expect(typeof useGetDiscoverDestinationsQuery).toBe('function')
      expect(typeof useGetDiscoverWorldsByNamesQuery).toBe('function')
      expect(typeof useGetHotScenesQuery).toBe('function')
      expect(typeof useGetLiveWorldsQuery).toBe('function')
      expect(typeof useGetDiscoverPlaceByPositionQuery).toBe('function')
      expect(typeof useGetDiscoverWorldByNameQuery).toBe('function')
      expect(typeof useGetCommunitiesListQuery).toBe('function')
    })
  })

  describe('when fetching curated destinations', () => {
    it('should request /destinations with the default limit and the highlighted filter', async () => {
      const payload = { ok: true, total: 1, data: [createPlace()] }
      fetchMock.mockResolvedValue(jsonResponse(payload))

      const { result } = renderQuery(() => useGetDiscoverDestinationsQuery({ only_highlighted: true }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith('https://places.test/api/destinations?limit=100&offset=0&only_highlighted=true')
      // One row against the 100 default limit → the client stamps the feed as
      // exhausted (the infinite-scroll stop signal).
      expect(result.current.data).toEqual({ ...payload, exhausted: true })
    })

    it('should request most_active when the caller asks for it', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, total: 0, data: [] }))

      const { result } = renderQuery(() => useGetDiscoverDestinationsQuery({ order_by: 'most_active' }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith('https://places.test/api/destinations?limit=100&offset=0&order_by=most_active')
    })

    it('should omit order_by when the caller wants the curated order', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, total: 0, data: [] }))

      const { result } = renderQuery(() => useGetDiscoverDestinationsQuery({}))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith('https://places.test/api/destinations?limit=100&offset=0')
    })

    it('should assemble search, owner, realms-detail and repeated categories params', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, total: 0, data: [] }))

      const { result } = renderQuery(() =>
        useGetDiscoverDestinationsQuery({
          limit: 7,
          offset: 3,
          search: 'club',
          owner: '0xAbC',
          categories: ['art', 'music'],
          with_realms_detail: true
        })
      )
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith(
        'https://places.test/api/destinations?limit=7&offset=3&search=club&owner=0xAbC&with_realms_detail=true&categories=art&categories=music'
      )
    })

    it('should merge offset pages into one cache entry for infinite scroll', async () => {
      const page1 = { ok: true, total: 3, data: [createPlace({ id: 'd-1', title: 'One' }), createPlace({ id: 'd-2', title: 'Two' })] }
      const page2 = { ok: true, total: 3, data: [createPlace({ id: 'd-2', title: 'Two' }), createPlace({ id: 'd-3', title: 'Three' })] }
      fetchMock.mockResolvedValueOnce(jsonResponse(page1)).mockResolvedValueOnce(jsonResponse(page2))

      const { result, rerender } = renderQuery(({ offset }: { offset: number }) => useGetDiscoverDestinationsQuery({ limit: 2, offset }), {
        offset: 0
      })
      await waitFor(() => expect(result.current.data?.data).toHaveLength(2))

      rerender({ offset: 2 })
      await waitFor(() => expect(result.current.data?.data).toHaveLength(3))

      // Accumulated, deduped by id, latest total kept. Both pages were full
      // (limit 2), so the feed is not yet flagged exhausted.
      expect(result.current.data?.data.map(p => p.title)).toEqual(['One', 'Two', 'Three'])
      expect(result.current.data?.total).toBe(3)
      expect(result.current.data?.exhausted).toBe(false)
    })

    it('should flag the feed exhausted when a page comes back short', async () => {
      // total lies high (the merge dedupes overlapping pages, so accumulated
      // length can trail total forever) — the short page is the stop signal.
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, total: 50, data: [createPlace({ id: 'd-1' })] }))

      const { result } = renderQuery(() => useGetDiscoverDestinationsQuery({ limit: 2 }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.exhausted).toBe(true)
    })

    it('should drop search terms shorter than the API minimum of 3 chars', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, total: 0, data: [] }))

      const { result } = renderQuery(() => useGetDiscoverDestinationsQuery({ search: 'ab' }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith('https://places.test/api/destinations?limit=100&offset=0')
    })

    it('should surface a generic status error and log the raw body on a non-ok response', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ secret: 'server text' }, false, 502))

      const { result } = renderQuery(() => useGetDiscoverDestinationsQuery({ only_highlighted: true }))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 502, data: null })
      expect(warnSpy).toHaveBeenCalledWith('[discover.client] getDiscoverDestinations failed', expect.objectContaining({ status: 502 }))
    })

    it('should map a thrown fetch into a FETCH_ERROR', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const { result } = renderQuery(() => useGetDiscoverDestinationsQuery({ only_highlighted: true }))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 'FETCH_ERROR', error: 'network down' })
    })
  })

  describe('when fetching discover places', () => {
    it('should request /places with the default paging and sorting params', async () => {
      const payload = { ok: true, total: 1, data: [createPlace()] }
      fetchMock.mockResolvedValue(jsonResponse(payload))

      const { result } = renderQuery(() => useGetDiscoverPlacesQuery({}))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith('https://places.test/api/places?limit=24&offset=0&order_by=most_active&order=desc')
      expect(result.current.data).toEqual({ ok: true, total: 1, data: [createPlace()] })
    })

    it('should assemble search, owner and repeated categories params', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, total: 0, data: [] }))

      const { result } = renderQuery(() =>
        useGetDiscoverPlacesQuery({
          limit: 5,
          offset: 10,
          order_by: 'like_score',
          order: 'asc',
          search: 'club',
          owner: '0xAbC',
          categories: ['art', 'music']
        })
      )
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith(
        'https://places.test/api/places?limit=5&offset=10&order_by=like_score&order=asc&search=club&owner=0xAbC&categories=art&categories=music'
      )
    })

    it('should fall back to the prod places API when the env key is missing', async () => {
      mockEnvValues.PLACES_API_URL = undefined
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, total: 0, data: [] }))

      const { result } = renderQuery(() => useGetDiscoverPlacesQuery({}))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('https://places.decentraland.org/api/places?'))
    })

    it('should surface a generic status error and log the raw body on a non-ok response', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ secret: 'server text' }, false, 500))

      const { result } = renderQuery(() => useGetDiscoverPlacesQuery({}))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 500, data: null })
      expect(warnSpy).toHaveBeenCalledWith('[discover.client] getDiscoverPlaces failed', expect.objectContaining({ status: 500 }))
    })

    it('should map a thrown fetch into a FETCH_ERROR', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))

      const { result } = renderQuery(() => useGetDiscoverPlacesQuery({}))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 'FETCH_ERROR', error: 'network down' })
    })
  })

  describe('when fetching favourites', () => {
    describe('and there is no stored identity for the address', () => {
      it('should short-circuit to an empty page without a network call', async () => {
        mockLocalStorageGetIdentity.mockReturnValue(null)

        const { result } = renderQuery(() => useGetDiscoverFavoritesQuery({ address: '0xAbC' }))
        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(mockLocalStorageGetIdentity).toHaveBeenCalledWith('0xabc')
        expect(result.current.data).toEqual({ ok: true, total: 0, data: [] })
        expect(mockFetchWithOptionalIdentity).not.toHaveBeenCalled()
      })
    })

    describe('and a stored identity exists', () => {
      let identity: { authChain: unknown[] }

      beforeEach(() => {
        identity = { authChain: [] }
        mockLocalStorageGetIdentity.mockReturnValue(identity)
      })

      it('should signed-fetch the only_favorites listing with that identity', async () => {
        const payload = { ok: true, total: 1, data: [createPlace({ id: 'fav-1' })] }
        mockFetchWithOptionalIdentity.mockResolvedValue(jsonResponse(payload))

        const { result } = renderQuery(() => useGetDiscoverFavoritesQuery({ address: '0xAbC' }))
        await waitFor(() => expect(result.current.isSuccess).toBe(true))

        expect(mockFetchWithOptionalIdentity).toHaveBeenCalledWith(
          'https://places.test/api/destinations?only_favorites=true&limit=100',
          identity,
          undefined
        )
        expect(result.current.data?.data[0].id).toBe('fav-1')
      })

      it('should surface a generic status error when the signed fetch is rejected', async () => {
        mockFetchWithOptionalIdentity.mockResolvedValue(unreadableErrorResponse(401))

        const { result } = renderQuery(() => useGetDiscoverFavoritesQuery({ address: '0xAbC' }))
        await waitFor(() => expect(result.current.isError).toBe(true))

        expect(result.current.error).toEqual({ status: 401, data: null })
      })

      it('should map a thrown signed fetch into a FETCH_ERROR', async () => {
        mockFetchWithOptionalIdentity.mockRejectedValue(new Error('signature expired'))

        const { result } = renderQuery(() => useGetDiscoverFavoritesQuery({ address: '0xAbC' }))
        await waitFor(() => expect(result.current.isError).toBe(true))

        expect(result.current.error).toEqual({ status: 'FETCH_ERROR', error: 'signature expired' })
      })
    })
  })

  describe('when fetching hot scenes', () => {
    it('should append the limit param when provided', async () => {
      const scenes = [{ id: 's1', name: 'Plaza', baseCoords: [0, 0], usersTotalCount: 9, realms: [], parcels: [] }]
      fetchMock.mockResolvedValue(jsonResponse(scenes))

      const { result } = renderQuery(() => useGetHotScenesQuery({ limit: 3 }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith('https://hot.test/hot-scenes?limit=3')
      expect(result.current.data?.[0].usersTotalCount).toBe(9)
    })

    it('should hit the bare feed URL when no args are provided', async () => {
      fetchMock.mockResolvedValue(jsonResponse([]))

      const { result } = renderQuery(() => useGetHotScenesQuery(undefined))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith('https://hot.test/hot-scenes')
    })

    it('should coerce a non-array body into an empty list', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ unexpected: 'shape' }))

      const { result } = renderQuery(() => useGetHotScenesQuery(undefined))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })

    it('should surface a generic status error on a non-ok response', async () => {
      fetchMock.mockResolvedValue(unreadableErrorResponse(503))

      const { result } = renderQuery(() => useGetHotScenesQuery(undefined))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 503, data: null })
    })

    it('should map a thrown fetch into a FETCH_ERROR', async () => {
      fetchMock.mockRejectedValue(new Error('hot scenes down'))

      const { result } = renderQuery(() => useGetHotScenesQuery(undefined))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 'FETCH_ERROR', error: 'hot scenes down' })
    })
  })

  describe('when fetching live worlds', () => {
    it('should request the env-driven live-data feed and pass through the array shape', async () => {
      const perWorld = [{ worldName: 'AliceWorld', users: 4 }]
      fetchMock.mockResolvedValue(jsonResponse({ data: { perWorld } }))

      const { result } = renderQuery(() => useGetLiveWorldsQuery())
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith('https://worlds.test/live-data')
      expect(result.current.data).toEqual([{ worldName: 'AliceWorld', users: 4 }])
    })

    it('should convert the OpenAPI record shape into entries', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: { perWorld: { aworld: 2, bworld: 5 } } }))

      const { result } = renderQuery(() => useGetLiveWorldsQuery())
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([
        { worldName: 'aworld', users: 2 },
        { worldName: 'bworld', users: 5 }
      ])
    })

    it('should default to an empty list when perWorld is absent', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: {} }))

      const { result } = renderQuery(() => useGetLiveWorldsQuery())
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
    })

    it('should surface a generic status error on a non-ok response', async () => {
      fetchMock.mockResolvedValue(unreadableErrorResponse(500))

      const { result } = renderQuery(() => useGetLiveWorldsQuery())
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 500, data: null })
    })

    it('should map a thrown fetch into a FETCH_ERROR', async () => {
      fetchMock.mockRejectedValue(new Error('live data down'))

      const { result } = renderQuery(() => useGetLiveWorldsQuery())
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 'FETCH_ERROR', error: 'live data down' })
    })
  })

  describe('when looking up a place by position', () => {
    it('should return the first place containing the parcel', async () => {
      const payload = { ok: true, total: 2, data: [createPlace({ id: 'first' }), createPlace({ id: 'second' })] }
      fetchMock.mockResolvedValue(jsonResponse(payload))

      const { result } = renderQuery(() => useGetDiscoverPlaceByPositionQuery({ position: [-3, -2] }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith('https://places.test/api/places?positions=-3,-2')
      expect(result.current.data?.id).toBe('first')
    })

    it('should resolve null when the parcel has no place', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, total: 0, data: [] }))

      const { result } = renderQuery(() => useGetDiscoverPlaceByPositionQuery({ position: [100, 100] }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeNull()
    })

    it('should surface a generic status error on a non-ok response', async () => {
      fetchMock.mockResolvedValue(unreadableErrorResponse(500))

      const { result } = renderQuery(() => useGetDiscoverPlaceByPositionQuery({ position: [0, 0] }))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 500, data: null })
    })

    it('should map a thrown fetch into a FETCH_ERROR', async () => {
      fetchMock.mockRejectedValue(new Error('positions down'))

      const { result } = renderQuery(() => useGetDiscoverPlaceByPositionQuery({ position: [0, 0] }))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 'FETCH_ERROR', error: 'positions down' })
    })
  })

  describe('when looking up a world by name', () => {
    it('should lowercase and URL-encode the name filter', async () => {
      const payload = { ok: true, total: 1, data: [createPlace({ world: true, world_name: 'My World.eth' })] }
      fetchMock.mockResolvedValue(jsonResponse(payload))

      const { result } = renderQuery(() => useGetDiscoverWorldByNameQuery({ name: 'My World.eth' }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith('https://places.test/api/worlds?names=my%20world.eth')
      expect(result.current.data?.world_name).toBe('My World.eth')
    })

    it('should resolve null for an unknown world', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, total: 0, data: [] }))

      const { result } = renderQuery(() => useGetDiscoverWorldByNameQuery({ name: 'ghost.eth' }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeNull()
    })

    it('should surface a generic status error on a non-ok response', async () => {
      fetchMock.mockResolvedValue(unreadableErrorResponse(500))

      const { result } = renderQuery(() => useGetDiscoverWorldByNameQuery({ name: 'ghost.eth' }))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 500, data: null })
    })

    it('should map a thrown fetch into a FETCH_ERROR', async () => {
      fetchMock.mockRejectedValue(new Error('names down'))

      const { result } = renderQuery(() => useGetDiscoverWorldByNameQuery({ name: 'ghost.eth' }))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 'FETCH_ERROR', error: 'names down' })
    })
  })

  describe('when batch-fetching worlds by names', () => {
    it('should short-circuit to an empty list without a network call for zero names', async () => {
      const { result } = renderQuery(() => useGetDiscoverWorldsByNamesQuery({ names: [] }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual([])
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('should append every name lowercased', async () => {
      const payload = { ok: true, total: 1, data: [createPlace({ world: true, world_name: 'AliceWorld' })] }
      fetchMock.mockResolvedValue(jsonResponse(payload))

      const { result } = renderQuery(() => useGetDiscoverWorldsByNamesQuery({ names: ['AliceWorld', 'BobWorld'] }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetchMock).toHaveBeenCalledWith('https://places.test/api/worlds?names=aliceworld&names=bobworld')
      expect(result.current.data).toEqual([createPlace({ world: true, world_name: 'AliceWorld' })])
    })

    it('should dedupe cache entries when the same names arrive in a different order', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true, total: 0, data: [] }))

      const store = buildStore()
      // eslint-disable-next-line react/no-children-prop
      const wrapper = ({ children }: { children?: ReactNode }) => createElement(Provider, { store, children })
      const first = renderHook(() => useGetDiscoverWorldsByNamesQuery({ names: ['beta', 'alpha'] }), { wrapper })
      const second = renderHook(() => useGetDiscoverWorldsByNamesQuery({ names: ['alpha', 'beta'] }), { wrapper })

      await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
      await waitFor(() => expect(second.result.current.isSuccess).toBe(true))

      // The sorted+joined serializeQueryArgs collapses both arg orders into one
      // cache entry, so only a single request goes out.
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('should surface a generic status error on a non-ok response', async () => {
      fetchMock.mockResolvedValue(unreadableErrorResponse(500))

      const { result } = renderQuery(() => useGetDiscoverWorldsByNamesQuery({ names: ['aworld'] }))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 500, data: null })
    })

    it('should map a thrown fetch into a FETCH_ERROR', async () => {
      fetchMock.mockRejectedValue(new Error('batch down'))

      const { result } = renderQuery(() => useGetDiscoverWorldsByNamesQuery({ names: ['aworld'] }))
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error).toEqual({ status: 'FETCH_ERROR', error: 'batch down' })
    })
  })

  describe('when listing communities', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ data: { results: [], total: 0 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should request /v1/communities with default paging and onlyMemberOf=false', async () => {
      const { result } = renderQuery(() => useGetCommunitiesListQuery({}))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const request = fetchMock.mock.calls[0][0] as Request
      expect(request.url).toBe('https://social.test/v1/communities?limit=24&offset=0&onlyMemberOf=false')
      expect(result.current.data).toEqual({ data: { results: [], total: 0 } })
    })

    it('should append the search filter when provided', async () => {
      const { result } = renderQuery(() => useGetCommunitiesListQuery({ limit: 10, offset: 20, search: 'club' }))
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const request = fetchMock.mock.calls[0][0] as Request
      expect(request.url).toBe('https://social.test/v1/communities?limit=10&offset=20&onlyMemberOf=false&search=club')
    })
  })
})
