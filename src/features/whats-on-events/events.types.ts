/* eslint-disable @typescript-eslint/naming-convention */
import type { AuthIdentity } from '@dcl/crypto'

type EventListType = 'all' | 'active' | 'live' | 'upcoming'
type EventOrder = 'asc' | 'desc'
type RecurrentFrequency = 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY' | 'HOURLY' | 'MINUTELY' | 'SECONDLY'

interface EventEntry {
  id: string
  name: string
  description: string | null
  image: string | null
  image_vertical: string | null
  start_at: string
  finish_at: string
  next_start_at: string
  next_finish_at: string
  duration: number
  all_day: boolean
  x: number
  y: number
  coordinates: [number, number]
  position: [number, number]
  server: string | null
  url: string
  user: string
  user_name: string | null
  estate_id: string | null
  estate_name: string | null
  scene_name: string | null
  approved: boolean
  rejected: boolean
  highlighted: boolean
  trending: boolean
  recurrent: boolean
  recurrent_frequency: RecurrentFrequency | null
  recurrent_dates: string[]
  contact: string | null
  details: string | null
  categories: string[]
  schedules: string[]
  world: boolean
  place_id: string | null
  community_id: string | null
  total_attendees: number
  latest_attendees: string[]
  attending?: boolean
  live: boolean
  created_at: string
  updated_at: string
}

interface EventsResponse {
  ok: boolean
  total: number
  data: EventEntry[]
}

interface EventsQueryParams {
  list?: EventListType
  limit?: number
  offset?: number
  order?: EventOrder
  search?: string
  world?: boolean
  from?: string
  to?: string
  position?: string
  creator?: string
  schedule?: string
}

interface AuthenticatedQueryParams {
  identity?: AuthIdentity
}

interface EventAttendee {
  event_id: string
  user: string
  user_name: string | null
  created_at: string
}

interface EventAttendeesResponse {
  ok: boolean
  data: EventAttendee[]
}

interface ToggleAttendeeParams {
  eventId: string
  attending: boolean
  identity: AuthIdentity
}

/* eslint-disable @typescript-eslint/naming-convention */
interface CreateEventPayload {
  name: string
  description: string | null
  start_at: string
  duration: number
  x: number
  y: number
  image?: string | null
  image_vertical?: string | null
  contact?: string | null
  categories?: string[]
  world?: boolean
  server?: string | null
  community_id?: string | null
  recurrent?: boolean
  recurrent_frequency?: RecurrentFrequency | null
  recurrent_interval?: number
  recurrent_count?: number | null
  recurrent_until?: string | null
}
/* eslint-enable @typescript-eslint/naming-convention */

interface CreateEventParams {
  payload: CreateEventPayload
  identity: AuthIdentity
}

interface UpdateEventParams {
  eventId: string
  payload: Partial<CreateEventPayload>
  identity: AuthIdentity
}

interface CreateEventResponse {
  ok: boolean
  data: EventEntry
}

interface GetEventByIdParams {
  eventId: string
  identity?: AuthIdentity
}

interface PosterData {
  filename: string
  url: string
  size: number
  type: string
}

interface PosterResponse {
  ok: boolean
  data: PosterData
}

interface UploadPosterParams {
  file: File
  identity: AuthIdentity
}

interface CommunityAttributes {
  id: string
  name: string
  ownerAddress: string
  active: boolean
  thumbnails?: { raw: string }
}

interface CommunitiesResponse {
  data: { results: CommunityAttributes[] }
}

interface GetCommunitiesParams {
  identity: AuthIdentity | undefined
}

export type {
  AuthenticatedQueryParams,
  CommunitiesResponse,
  CommunityAttributes,
  CreateEventParams,
  CreateEventPayload,
  CreateEventResponse,
  EventAttendee,
  EventAttendeesResponse,
  EventEntry,
  EventListType,
  EventOrder,
  EventsQueryParams,
  EventsResponse,
  GetCommunitiesParams,
  GetEventByIdParams,
  PosterData,
  PosterResponse,
  RecurrentFrequency,
  ToggleAttendeeParams,
  UpdateEventParams,
  UploadPosterParams
}
