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
  // The wallet that deployed the scene. This — not `owner`, which is whoever
  // holds the LAND or the world name — is who the places-api says made it.
  creator_address?: string | null
  categories?: string[]
  highlighted?: boolean
  favorites?: number
  likes?: number
  dislikes?: number
  user_count?: number
  // Set only when the request asked for `with_live_events`: true when the events API reports an
  // event running at this place right now. Presence (`user_count`) is a different thing.
  live?: boolean
  // Title of that event, from the same `with_live_events` join. Absent on rows with no event, and
  // absent everywhere until the places-api field ships, so the badge has to read fine without it.
  live_event_name?: string
  world?: boolean
  world_name?: string
}

// The subset of a places-api row that decides who a place is credited to.
// Kept structural so the /events place-card enrichment, which reads the raw
// API row rather than a DiscoverPlace, shares the same resolution rule.
interface PlaceCreatorSource {
  owner?: string | null
  creator_address?: string | null
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

// `/destinations` — the combined places + worlds feed. Omitting `order_by`
// gets the curated order (highlighted, then ranking); `most_active` puts the
// scenes people are actually in on top, with curation as the tie-breaker.
interface GetDiscoverDestinationsArgs {
  limit?: number
  offset?: number
  order_by?: DiscoverOrderBy
  search?: string
  categories?: string[]
  owner?: string
  only_highlighted?: boolean
  // Adds real-time realm/user-count detail to every row (`user_count` becomes
  // live instead of the stale snapshot) — powers the grid's LIVE badges.
  with_realms_detail?: boolean
  // Adds `live` to every row, resolved against the events API. This — not the head count — is
  // what the red LIVE badge means.
  with_live_events?: boolean
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
  DiscoverPlacesResponse,
  PlaceCreatorSource
}
