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

type DiscoverOrderBy = 'most_active' | 'name' | 'created_at' | 'updated_at' | 'like_score_best'

type DiscoverOrder = 'asc' | 'desc'

interface GetDiscoverPlacesArgs {
  limit?: number
  offset?: number
  order_by?: DiscoverOrderBy
  order?: DiscoverOrder
  search?: string
  categories?: string[]
  only_pois?: boolean
}

interface GetDiscoverWorldsArgs {
  limit?: number
  offset?: number
  order_by?: DiscoverOrderBy
  order?: DiscoverOrder
  search?: string
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
  GetDiscoverPlacesArgs,
  GetDiscoverWorldsArgs,
  HotScene,
  LiveWorldEntry,
  DiscoverCommunitiesResponse,
  DiscoverCommunity,
  DiscoverOrder,
  DiscoverOrderBy,
  DiscoverPlace,
  DiscoverPlacesResponse
}
