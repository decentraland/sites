import { localStorageGetIdentity } from '@dcl/single-sign-on-client'
import { getEnv } from '../../config/env'
import { captureDiscoverError } from '../../modules/discoverSentry'
import { placesClient } from '../../services/placesClient'
import { socialClient } from '../../services/socialClient'
import { fetchWithOptionalIdentity } from '../../utils/signedFetch'
import { getWorldsContentServerUrl } from './sceneAdapter'
import type {
  DiscoverCommunitiesResponse,
  DiscoverPlace,
  DiscoverPlacesResponse,
  GetCommunitiesListArgs,
  GetDiscoverDestinationsArgs,
  GetDiscoverFavoritesArgs,
  GetDiscoverPlacesArgs,
  HotScene,
  LiveWorldEntry
} from './discover.types'

// Social reads its data URLs from the env file (`dev.json` → prod,
// `stg.json` → zone, `prd.json` → prod). The fallback constants only
// trigger if an env key is missing entirely — keeps a stripped-down
// build from silently joining an empty cluster.
const FALLBACK_PLACES_API_URL = 'https://places.decentraland.org/api'
const FALLBACK_HOT_SCENES_URL = 'https://realm-provider-ea.decentraland.org/hot-scenes'

const getPlacesApiUrl = (): string => getEnv('PLACES_API_URL') || FALLBACK_PLACES_API_URL
const getHotScenesUrl = (): string => getEnv('HOT_SCENES_URL') || FALLBACK_HOT_SCENES_URL

function buildPlacesListUrl(baseUrl: string, args: GetDiscoverPlacesArgs): string {
  const params = new URLSearchParams()
  params.set('limit', String(args.limit ?? 24))
  params.set('offset', String(args.offset ?? 0))
  params.set('order_by', args.order_by ?? 'most_active')
  params.set('order', args.order ?? 'desc')
  if (args.search) params.set('search', args.search)
  if (args.owner) params.set('owner', args.owner)
  for (const c of args.categories ?? []) params.append('categories', c)
  return `${baseUrl}/places?${params.toString()}`
}

// `/destinations` mixes places + worlds in one feed. `limit` is capped at 100
// server-side; `search` needs at least 3 chars (shorter values 400) so the
// builder drops it below that.
const DESTINATIONS_DEFAULT_LIMIT = 100

function buildDestinationsUrl(baseUrl: string, args: GetDiscoverDestinationsArgs): string {
  const params = new URLSearchParams()
  params.set('limit', String(args.limit ?? DESTINATIONS_DEFAULT_LIMIT))
  params.set('offset', String(args.offset ?? 0))
  // Omitted rather than defaulted: the curated order is what the Featured rail
  // and My Places want, so only the caller that wants live-first asks for it.
  if (args.order_by) params.set('order_by', args.order_by)
  if (args.search && args.search.trim().length >= 3) params.set('search', args.search.trim())
  if (args.owner) params.set('owner', args.owner)
  if (args.only_highlighted) params.set('only_highlighted', 'true')
  if (args.with_realms_detail) params.set('with_realms_detail', 'true')
  if (args.with_live_events) params.set('with_live_events', 'true')
  for (const c of args.categories ?? []) params.append('categories', c)
  return `${baseUrl}/destinations?${params.toString()}`
}

// Surface a generic status on errors. The raw upstream body is logged so we can
// debug from the console without exposing server text to React state (rule 10),
// and the failure is reported to Sentry so a places-api / catalyst outage is
// visible in production even where the UI degrades gracefully.
function logAndShape(scope: string, response: Response, body: string | null) {
  console.warn(`[discover.client] ${scope} failed`, { status: response.status, body })
  void captureDiscoverError(new Error(`[discover.client] ${scope} failed with ${response.status}`), {
    scope,
    status: String(response.status)
  })
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

    // Places AND worlds in one feed — browse grid, My Places and the Featured
    // rail all read from here. It is also the only server-side way to get
    // highlighted worlds (`/worlds` ignores `only_highlighted`).
    getDiscoverDestinations: build.query<DiscoverPlacesResponse, GetDiscoverDestinationsArgs>({
      queryFn: async args => {
        try {
          const response = await fetch(buildDestinationsUrl(getPlacesApiUrl(), args))
          if (!response.ok) return logAndShape('getDiscoverDestinations', response, await response.text().catch(() => null))
          const json: DiscoverPlacesResponse = await response.json()
          // A short page means the feed is drained. This — not `total` — is
          // the infinite-scroll stop signal: `merge` dedupes overlapping pages
          // (the feed order shifts with real-time data), so accumulated length
          // can trail `total` forever.
          return { data: { ...json, exhausted: json.data.length < (args.limit ?? DESTINATIONS_DEFAULT_LIMIT) } }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      // Infinite scroll: one cache entry per filter set — `offset` pages merge
      // into it (same pattern as cms getBlogPosts / communities).
      serializeQueryArgs: ({ queryArgs }) => {
        const { offset, ...rest } = queryArgs
        return rest
      },
      merge: (currentCache, newItems, { arg }) => {
        if ((arg.offset ?? 0) === 0) return newItems
        const existingIds = new Set(currentCache.data.map(p => p.id))
        return {
          ...newItems,
          data: [...currentCache.data, ...newItems.data.filter(p => !existingIds.has(p.id))]
        }
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.offset !== previousArg?.offset
    }),

    // FAVOURITES tab. `only_favorites` is resolved server-side against the
    // signed-fetch identity; without a stored identity for the address we
    // return an empty page (the UI shows the sign-in empty state instead).
    // Reads `/destinations` so favourited WORLDS show up too, not just places.
    getDiscoverFavorites: build.query<DiscoverPlacesResponse, GetDiscoverFavoritesArgs>({
      queryFn: async ({ address }) => {
        try {
          const identity = localStorageGetIdentity(address.toLowerCase()) ?? undefined
          if (!identity) return { data: { ok: true, total: 0, data: [] } }
          const params = new URLSearchParams()
          params.set('only_favorites', 'true')
          // Server-side max page. No pagination yet: >100 favourites truncates
          // — acceptable for now, revisit with the destinations merge pattern
          // if real users hit the cap.
          params.set('limit', '100')
          const response = await fetchWithOptionalIdentity(`${getPlacesApiUrl()}/destinations?${params.toString()}`, identity, undefined)
          if (!response.ok) return logAndShape('getDiscoverFavorites', response, await response.text().catch(() => null))
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
          if (!Array.isArray(data)) {
            // Contract drift would silently blank the LIVE rail — make it loud.
            console.warn('[discover.client] getHotScenes unexpected response shape', { data })
            return { data: [] }
          }
          return { data }
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
          // Contract drift would silently blank the LIVE rail — make it loud.
          console.warn('[discover.client] getLiveWorlds unexpected response shape', { body })
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
  useGetDiscoverDestinationsQuery,
  useGetDiscoverFavoritesQuery,
  useGetDiscoverPlacesQuery,
  useGetDiscoverWorldsByNamesQuery,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery,
  useGetDiscoverPlaceByPositionQuery,
  useGetDiscoverWorldByNameQuery
} = discoverPlacesEndpoints

const { useGetCommunitiesListQuery } = discoverCommunitiesListEndpoints

export {
  useGetCommunitiesListQuery,
  useGetDiscoverDestinationsQuery,
  useGetDiscoverFavoritesQuery,
  useGetHotScenesQuery,
  useGetLiveWorldsQuery,
  useGetDiscoverPlaceByPositionQuery,
  useGetDiscoverPlacesQuery,
  useGetDiscoverWorldByNameQuery,
  useGetDiscoverWorldsByNamesQuery
}
