/* eslint-disable @typescript-eslint/naming-convention */

// Places API returns these on /places. World items come back on /worlds with
// extra `world_name` populated. We model them as one shape with optional
// world fields so the same card component renders both surfaces.
interface SocialPlace {
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

interface SocialPlacesResponse {
  ok: boolean
  total: number
  data: SocialPlace[]
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

type SocialOrderBy = 'most_active' | 'name' | 'created_at' | 'updated_at' | 'like_score_best'

type SocialOrder = 'asc' | 'desc'

interface GetSocialPlacesArgs {
  limit?: number
  offset?: number
  order_by?: SocialOrderBy
  order?: SocialOrder
  search?: string
  categories?: string[]
  only_pois?: boolean
}

interface GetSocialWorldsArgs {
  limit?: number
  offset?: number
  order_by?: SocialOrderBy
  order?: SocialOrder
  search?: string
}

interface GetCommunitiesListArgs {
  limit?: number
  offset?: number
  search?: string
}

interface SocialCommunity {
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

interface SocialCommunitiesResponse {
  data: {
    results: SocialCommunity[]
    total: number
  }
}

export type {
  GetCommunitiesListArgs,
  GetSocialPlacesArgs,
  GetSocialWorldsArgs,
  HotScene,
  LiveWorldEntry,
  SocialCommunitiesResponse,
  SocialCommunity,
  SocialOrder,
  SocialOrderBy,
  SocialPlace,
  SocialPlacesResponse
}
