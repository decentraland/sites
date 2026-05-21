import { getEnv } from '../../config/env'
import { placesClient } from '../../services/placesClient'
import { socialClient } from '../../services/socialClient'
import type {
  DiscoverCommunitiesResponse,
  DiscoverPlace,
  DiscoverPlacesResponse,
  GetCommunitiesListArgs,
  GetDiscoverPlacesArgs,
  GetDiscoverWorldsArgs,
  HotScene,
  LiveWorldEntry
} from './discover.types'

// Discover reads its data URLs from the env file (`dev.json` → prod,
// `stg.json` → zone, `prd.json` → prod). The fallback constants only
// trigger if an env key is missing entirely — keeps a stripped-down
// build from silently joining an empty cluster.
const FALLBACK_PLACES_API_URL = 'https://places.decentraland.org/api'
const FALLBACK_HOT_SCENES_URL = 'https://realm-provider-ea.decentraland.org/hot-scenes'
const FALLBACK_WORLDS_CONTENT_SERVER_URL = 'https://worlds-content-server.decentraland.org'

const getPlacesApiUrl = (): string => getEnv('PLACES_API_URL') || FALLBACK_PLACES_API_URL
const getHotScenesUrl = (): string => getEnv('HOT_SCENES_URL') || FALLBACK_HOT_SCENES_URL
const getWorldsContentServerUrl = (): string => getEnv('WORLDS_CONTENT_SERVER_URL') || FALLBACK_WORLDS_CONTENT_SERVER_URL

function buildPlacesListUrl(baseUrl: string, args: GetDiscoverPlacesArgs): string {
  const params = new URLSearchParams()
  params.set('limit', String(args.limit ?? 24))
  params.set('offset', String(args.offset ?? 0))
  params.set('order_by', args.order_by ?? 'most_active')
  params.set('order', args.order ?? 'desc')
  if (args.search) params.set('search', args.search)
  if (args.only_pois) params.set('only_pois', 'true')
  for (const c of args.categories ?? []) params.append('categories', c)
  return `${baseUrl}/places?${params.toString()}`
}

function buildWorldsListUrl(baseUrl: string, args: GetDiscoverWorldsArgs): string {
  const params = new URLSearchParams()
  params.set('limit', String(args.limit ?? 24))
  params.set('offset', String(args.offset ?? 0))
  params.set('order_by', args.order_by ?? 'most_active')
  params.set('order', args.order ?? 'desc')
  if (args.search) params.set('search', args.search)
  return `${baseUrl}/worlds?${params.toString()}`
}

// Surface a generic status on errors. The raw upstream body is logged so we can
// debug from the console / Sentry without exposing server text to React state
// (rule 10).
function logAndShape(scope: string, response: Response, body: string | null) {
  console.warn(`[discover.client] ${scope} failed`, { status: response.status, body })
  return { error: { status: response.status, data: null } } as const
}

const discoverPlacesEndpoints = placesClient.injectEndpoints({
  endpoints: build => ({
    getDiscoverPlaces: build.query<DiscoverPlacesResponse, GetDiscoverPlacesArgs>({
      queryFn: async args => {
        try {
          const baseUrl = getPlacesApiUrl()
          const response = await fetch(buildPlacesListUrl(baseUrl, args))
          if (!response.ok) return logAndShape('getDiscoverPlaces', response, await response.text().catch(() => null))
          const json: DiscoverPlacesResponse = await response.json()
          return { data: json }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }),

    getDiscoverWorlds: build.query<DiscoverPlacesResponse, GetDiscoverWorldsArgs>({
      queryFn: async args => {
        try {
          const baseUrl = getPlacesApiUrl()
          const response = await fetch(buildWorldsListUrl(baseUrl, args))
          if (!response.ok) return logAndShape('getDiscoverWorlds', response, await response.text().catch(() => null))
          const json: DiscoverPlacesResponse = await response.json()
          return { data: json }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }),

    // Hot Scenes feed from realm-provider. Used by the LIVE tab to highlight
    // Genesis City parcels that currently have users in-world. We then
    // cross-reference with place metadata client-side to render the same card
    // shape as EXPLORE.
    getHotScenes: build.query<HotScene[], { limit?: number } | undefined>({
      queryFn: async args => {
        try {
          const baseUrl = getHotScenesUrl()
          const params = new URLSearchParams()
          if (args?.limit) params.set('limit', String(args.limit))
          const qs = params.toString()
          const response = await fetch(qs ? `${baseUrl}?${qs}` : baseUrl)
          if (!response.ok) return logAndShape('getHotScenes', response, await response.text().catch(() => null))
          const data: HotScene[] = await response.json()
          return { data: Array.isArray(data) ? data : [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }),

    // Live worlds feed from worlds-content-server. Counterpart to hot-scenes
    // for the World namespace — hot-scenes only sees Genesis City realms.
    // URL follows the env so the feed and the watcher always join the same
    // cluster (dev → prod, stg → zone, prd → prod).
    getLiveWorlds: build.query<LiveWorldEntry[], void>({
      queryFn: async () => {
        try {
          const response = await fetch(`${getWorldsContentServerUrl()}/live-data`)
          if (!response.ok) return logAndShape('getLiveWorlds', response, await response.text().catch(() => null))
          const body = (await response.json()) as { data?: { perWorld?: LiveWorldEntry[] } }
          const list = body.data?.perWorld
          // The OpenAPI describes `perWorld` as a `Record<string, number>` but
          // the live API returns `Array<{worldName, users}>`. Defend against
          // both shapes so a future flip doesn't blow up the page.
          if (Array.isArray(list)) return { data: list }
          if (list && typeof list === 'object') {
            return { data: Object.entries(list as Record<string, number>).map(([worldName, users]) => ({ worldName, users })) }
          }
          return { data: [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }),

    // Look up a single place by position (Genesis City parcel like `-3,-2`).
    // Returns the first hit (places-api echoes all places containing the
    // requested parcel; the LAND-deployed scene comes back first).
    getDiscoverPlaceByPosition: build.query<DiscoverPlace | null, { position: [number, number] }>({
      queryFn: async ({ position }) => {
        try {
          const baseUrl = getPlacesApiUrl()
          const response = await fetch(`${baseUrl}/places?positions=${position[0]},${position[1]}`)
          if (!response.ok) return logAndShape('getDiscoverPlaceByPosition', response, await response.text().catch(() => null))
          const json: DiscoverPlacesResponse = await response.json()
          return { data: json.data?.[0] ?? null }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: (_r, _e, { position }) => [{ type: 'Place', id: `${position[0]},${position[1]}` }]
    }),

    // Look up a single world by ENS name.
    getDiscoverWorldByName: build.query<DiscoverPlace | null, { name: string }>({
      queryFn: async ({ name }) => {
        try {
          const baseUrl = getPlacesApiUrl()
          const response = await fetch(`${baseUrl}/worlds?names=${encodeURIComponent(name.toLowerCase())}`)
          if (!response.ok) return logAndShape('getDiscoverWorldByName', response, await response.text().catch(() => null))
          const json: DiscoverPlacesResponse = await response.json()
          return { data: json.data?.[0] ?? null }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: (_r, _e, { name }) => [{ type: 'World', id: name.toLowerCase() }]
    }),

    // Batch metadata for a specific list of worlds (used by the LIVE tab to
    // resolve images/titles for the active worlds returned by `/live-data`).
    // Most active-but-niche worlds are NOT in the top-N of /api/worlds; this
    // hits the same endpoint with `names=` filters to retrieve them directly.
    getDiscoverWorldsByNames: build.query<DiscoverPlace[], { names: string[] }>({
      queryFn: async ({ names }) => {
        try {
          if (names.length === 0) return { data: [] }
          const baseUrl = getPlacesApiUrl()
          const params = new URLSearchParams()
          for (const n of names) params.append('names', n.toLowerCase())
          const response = await fetch(`${baseUrl}/worlds?${params.toString()}`)
          if (!response.ok) return logAndShape('getDiscoverWorldsByNames', response, await response.text().catch(() => null))
          const json: DiscoverPlacesResponse = await response.json()
          return { data: json.data ?? [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      // Cache key off the sorted+joined names so the order doesn't churn the
      // cache when the same names come back from /live-data in different order.
      serializeQueryArgs: ({ queryArgs }) => ({ names: [...queryArgs.names].sort().join(',') })
    })
  }),
  overrideExisting: false
})

const discoverCommunitiesListEndpoints = socialClient.injectEndpoints({
  endpoints: builder => ({
    getCommunitiesList: builder.query<DiscoverCommunitiesResponse, GetCommunitiesListArgs>({
      query: ({ limit = 24, offset = 0, search }) => {
        const params = new URLSearchParams()
        params.set('limit', String(limit))
        params.set('offset', String(offset))
        params.set('onlyMemberOf', 'false')
        if (search) params.set('search', search)
        return `/v1/communities?${params.toString()}`
      }
    })
  }),
  overrideExisting: false
})

const {
  useGetDiscoverPlacesQuery,
  useGetDiscoverWorldsQuery,
  useGetDiscoverWorldsByNamesQuery,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery,
  useGetDiscoverPlaceByPositionQuery,
  useGetDiscoverWorldByNameQuery
} = discoverPlacesEndpoints

const { useGetCommunitiesListQuery } = discoverCommunitiesListEndpoints

export {
  useGetCommunitiesListQuery,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery,
  useGetDiscoverPlaceByPositionQuery,
  useGetDiscoverPlacesQuery,
  useGetDiscoverWorldByNameQuery,
  useGetDiscoverWorldsByNamesQuery,
  useGetDiscoverWorldsQuery
}
