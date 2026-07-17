/* eslint-disable @typescript-eslint/naming-convention */

// Places API returns these on /places. World items come back on /worlds with
// extra `world_name` populated. We model them as one shape with optional
// world fields so the same card component renders both surfaces.
interface DiscoverPlace {
  id: string
  title: string
  description: string
  image: string
  positions: string[]
  base_position?: string
  owner: string | null
  contact_name?: string
  categories?: string[]
  highlighted?: boolean
  favorites?: number
  likes?: number
  dislikes?: number
  user_count?: number
  user_name?: string
  world?: boolean
  world_name?: string
}

interface DiscoverPlacesResponse {
  ok: boolean
  total: number
  data: DiscoverPlace[]
  // Client-computed by getDiscoverDestinations: the last fetched page came
  // back short, so the feed is drained. `total` alone can't terminate the
  // infinite scroll — the merge dedupes overlapping pages, so the accumulated
  // length may trail `total` forever.
  exhausted?: boolean
}

// Hot Scenes (realm provider) — minimal subset used by the LIVE tab.
interface HotScene {
  id: string
  name: string
  baseCoords: [number, number]
  usersTotalCount: number
  realms: Array<{ serverName: string; usersCount: number }>
  parcels: [number, number][]
}

// Live worlds (worlds-content-server `/live-data`). Same role hot-scenes plays
// for Genesis City — tells us which worlds currently have users in them so
// the LIVE feed can surface them.
interface LiveWorldEntry {
  worldName: string
  users: number
}

// The values the places-api actually accepts (docs/openapi.yaml). There is no
// server-side alphabetical ordering on any list endpoint.
type DiscoverOrderBy = 'most_active' | 'like_score' | 'created_at' | 'updated_at'

type DiscoverOrder = 'asc' | 'desc'

interface GetDiscoverPlacesArgs {
  limit?: number
  offset?: number
  order_by?: DiscoverOrderBy
  order?: DiscoverOrder
  search?: string
  categories?: string[]
  owner?: string
}

// `/destinations` — the combined places + worlds feed. Highlighted rows are
// always returned first (API contract), then ranking, then `order_by`.
interface GetDiscoverDestinationsArgs {
  limit?: number
  offset?: number
  search?: string
  categories?: string[]
  owner?: string
  only_highlighted?: boolean
  // Adds real-time realm/user-count detail to every row (`user_count` becomes
  // live instead of the stale snapshot) — powers the grid's LIVE badges.
  with_realms_detail?: boolean
}

// Favourites need a signed request — the places-api resolves `only_favorites`
// against the identity that signed the fetch, so the wallet address (whose
// localStorage identity signs it) is the cache key.
interface GetDiscoverFavoritesArgs {
  address: string
}

interface GetCommunitiesListArgs {
  limit?: number
  offset?: number
  search?: string
}

interface DiscoverCommunity {
  id: string
  name: string
  description: string
  ownerAddress: string
  ownerName?: string
  privacy: 'public' | 'private'
  active: boolean
  membersCount: number
  thumbnails?: Record<string, string>
}

interface DiscoverCommunitiesResponse {
  data: {
    results: DiscoverCommunity[]
    total: number
  }
}

export type {
  GetCommunitiesListArgs,
  GetDiscoverDestinationsArgs,
  GetDiscoverFavoritesArgs,
  GetDiscoverPlacesArgs,
  HotScene,
  LiveWorldEntry,
  DiscoverCommunitiesResponse,
  DiscoverCommunity,
  DiscoverOrder,
  DiscoverOrderBy,
  DiscoverPlace,
  DiscoverPlacesResponse
}
