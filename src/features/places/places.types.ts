/* eslint-disable @typescript-eslint/naming-convention */

interface JumpEvent {
  id: string
  name: string
  image: string
  description: string
  start_at: string
  next_start_at: string
  finish_at: string
  next_finish_at: string
  coordinates: [number, number]
  recurrent: boolean
  user: string
  user_name: string
  total_attendees: number
  attending: boolean
  scene_name?: string
  position: [number, number]
  url?: string
  x: number
  y: number
  world?: boolean
  server?: string
  live?: boolean
}

interface JumpPlace {
  id: string
  title: string
  image: string
  description: string
  positions: string[]
  base_position: string
  owner: string | null
  contact_name?: string
  favorites?: number
  world?: boolean
  world_name?: string
  user_count?: number
  user_name?: string
  url?: string
}

interface JumpEventsResponse {
  ok: boolean
  data: JumpEvent[]
}

interface JumpPlacesResponse {
  ok: boolean
  data: JumpPlace[]
}

interface JumpEventResponse {
  ok: boolean
  data: JumpEvent
}

interface PeerSceneEntity {
  id: string
}

interface PeerDeployment {
  entityId: string
  deployedBy: string
}

interface PeerProfile {
  timestamp: number
  avatars: Array<{
    name: string
    userId: string
    realName?: string
    avatar: { snapshots: { face256: string; body: string } }
  }>
}

interface SceneDeployerInfo {
  deployerAddress: string
  deployerName: string
  deployerAvatar?: string
}

interface CardData {
  id: string
  type: 'event' | 'place'
  title: string
  user_name: string
  user?: string
  user_avatar?: string
  coordinates: [number, number]
  image?: string
  description?: string
  start_at?: string
  finish_at?: string
  start_at_iso?: string
  finish_at_iso?: string
  recurrent?: boolean
  total_attendees?: number
  attending?: boolean
  live?: boolean
  user_count?: number
  favorites?: number
  url?: string
  scene_name?: string
  position: string
  realm?: string
}

interface Creator {
  user_name: string
  user: string
  avatar?: string
}

interface GetEventsArgs {
  position?: [number, number]
  realm?: string
}

interface GetEventByIdArgs {
  id: string
}

interface GetPlacesArgs {
  position?: [number, number]
  realm?: string
}

interface GetSceneMetadataArgs {
  position: string
}

export type {
  CardData,
  Creator,
  GetEventByIdArgs,
  GetEventsArgs,
  GetPlacesArgs,
  GetSceneMetadataArgs,
  JumpEvent,
  JumpEventResponse,
  JumpEventsResponse,
  JumpPlace,
  JumpPlacesResponse,
  PeerDeployment,
  PeerProfile,
  PeerSceneEntity,
  SceneDeployerInfo
}
