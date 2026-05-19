import { placesClient } from '../../services/placesClient'
import { socialClient } from '../../services/socialClient'
import type {
  GetCommunitiesListArgs,
  GetSocialPlacesArgs,
  GetSocialWorldsArgs,
  HotScene,
  LiveWorldEntry,
  SocialCommunitiesResponse,
  SocialPlace,
  SocialPlacesResponse
} from './discover.types'

// The /social/* feature reads from prod regardless of env. HOT_SCENES_URL is
// already prod in every env file; we mirror that here for places + hot-scenes
// + worlds-content-server so the entire LIVE experience renders against the
// same cluster (no dev/zone split-brain). Same trick keeps a localhost dev
// preview matching what users see on decentraland.org/social.
const PROD_PLACES_API_URL = 'https://places.decentraland.org/api'
const PROD_HOT_SCENES_URL = 'https://realm-provider-ea.decentraland.org/hot-scenes'
const PROD_WORLDS_CONTENT_SERVER_URL = 'https://worlds-content-server.decentraland.org'

function buildPlacesListUrl(baseUrl: string, args: GetSocialPlacesArgs): string {
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

function buildWorldsListUrl(baseUrl: string, args: GetSocialWorldsArgs): string {
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
  console.warn(`[social.client] ${scope} failed`, { status: response.status, body })
  return { error: { status: response.status, data: null } } as const
}

const socialPlacesEndpoints = placesClient.injectEndpoints({
  endpoints: build => ({
    getSocialPlaces: build.query<SocialPlacesResponse, GetSocialPlacesArgs>({
      queryFn: async args => {
        try {
          const baseUrl = PROD_PLACES_API_URL
          const response = await fetch(buildPlacesListUrl(baseUrl, args))
          if (!response.ok) return logAndShape('getSocialPlaces', response, await response.text().catch(() => null))
          const json: SocialPlacesResponse = await response.json()
          return { data: json }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }),

    getSocialWorlds: build.query<SocialPlacesResponse, GetSocialWorldsArgs>({
      queryFn: async args => {
        try {
          const baseUrl = PROD_PLACES_API_URL
          const response = await fetch(buildWorldsListUrl(baseUrl, args))
          if (!response.ok) return logAndShape('getSocialWorlds', response, await response.text().catch(() => null))
          const json: SocialPlacesResponse = await response.json()
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
          const baseUrl = PROD_HOT_SCENES_URL
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
    // We pin to the prod worlds-content-server (same reason as the gatekeeper)
    // so the LIVE feed matches the cluster real players are connected to.
    getLiveWorlds: build.query<LiveWorldEntry[], void>({
      queryFn: async () => {
        try {
          const response = await fetch(`${PROD_WORLDS_CONTENT_SERVER_URL}/live-data`)
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
    getSocialPlaceByPosition: build.query<SocialPlace | null, { position: [number, number] }>({
      queryFn: async ({ position }) => {
        try {
          const baseUrl = PROD_PLACES_API_URL
          const response = await fetch(`${baseUrl}/places?positions=${position[0]},${position[1]}`)
          if (!response.ok) return logAndShape('getSocialPlaceByPosition', response, await response.text().catch(() => null))
          const json: SocialPlacesResponse = await response.json()
          return { data: json.data?.[0] ?? null }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: (_r, _e, { position }) => [{ type: 'Place', id: `${position[0]},${position[1]}` }]
    }),

    // Look up a single world by ENS name.
    getSocialWorldByName: build.query<SocialPlace | null, { name: string }>({
      queryFn: async ({ name }) => {
        try {
          const baseUrl = PROD_PLACES_API_URL
          const response = await fetch(`${baseUrl}/worlds?names=${encodeURIComponent(name.toLowerCase())}`)
          if (!response.ok) return logAndShape('getSocialWorldByName', response, await response.text().catch(() => null))
          const json: SocialPlacesResponse = await response.json()
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
    getSocialWorldsByNames: build.query<SocialPlace[], { names: string[] }>({
      queryFn: async ({ names }) => {
        try {
          if (names.length === 0) return { data: [] }
          const baseUrl = PROD_PLACES_API_URL
          const params = new URLSearchParams()
          for (const n of names) params.append('names', n.toLowerCase())
          const response = await fetch(`${baseUrl}/worlds?${params.toString()}`)
          if (!response.ok) return logAndShape('getSocialWorldsByNames', response, await response.text().catch(() => null))
          const json: SocialPlacesResponse = await response.json()
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

const socialCommunitiesListEndpoints = socialClient.injectEndpoints({
  endpoints: builder => ({
    getCommunitiesList: builder.query<SocialCommunitiesResponse, GetCommunitiesListArgs>({
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
  useGetSocialPlacesQuery,
  useGetSocialWorldsQuery,
  useGetSocialWorldsByNamesQuery,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery,
  useGetSocialPlaceByPositionQuery,
  useGetSocialWorldByNameQuery
} = socialPlacesEndpoints

const { useGetCommunitiesListQuery } = socialCommunitiesListEndpoints

export {
  useGetCommunitiesListQuery,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery,
  useGetSocialPlaceByPositionQuery,
  useGetSocialPlacesQuery,
  useGetSocialWorldByNameQuery,
  useGetSocialWorldsByNamesQuery,
  useGetSocialWorldsQuery
}
