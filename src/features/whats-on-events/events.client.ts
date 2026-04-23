import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../config/env'
import { fetchWithIdentity, fetchWithOptionalIdentity } from '../../utils/signedFetch'
import { buildLiveNowCards, enrichPlaceCards } from './events.helpers'
import type { HotScene, LiveNowCard } from './events.helpers'
import type {
  AuthenticatedQueryParams,
  CommunitiesResponse,
  CommunityAttributes,
  CreateEventParams,
  CreateEventResponse,
  EventAttendeesResponse,
  EventEntry,
  EventsQueryParams,
  EventsResponse,
  GetCommunitiesParams,
  PosterData,
  PosterResponse,
  ToggleAttendeeParams,
  UpdateEventParams,
  UploadPosterParams
} from './events.types'

function buildQueryString(params: EventsQueryParams): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value))
    }
  }
  return searchParams.toString()
}

type GetEventsParams = EventsQueryParams & AuthenticatedQueryParams
type GetUpcomingParams = AuthenticatedQueryParams | void

const eventsClient = createApi({
  reducerPath: 'eventsClient',
  // Required by RTK Query but unused — all endpoints use queryFn with custom fetch calls
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Events', 'LiveNow'],
  keepUnusedDataFor: 60,
  endpoints: build => ({
    getEvents: build.query<EventEntry[], GetEventsParams>({
      serializeQueryArgs: ({ queryArgs: { identity, ...rest } }) => ({ ...rest, authenticated: Boolean(identity) }),
      queryFn: async params => {
        try {
          const { identity, ...queryParams } = params
          const baseUrl = getEnv('EVENTS_API_URL')!
          const query = buildQueryString(queryParams)
          const response = await fetchWithOptionalIdentity(`${baseUrl}/events?${query}`, identity)

          if (!response.ok) {
            throw new Error(`Events API error: ${response.status}`)
          }

          const data: EventsResponse = await response.json()
          return { data: data.data ?? [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['Events']
    }),
    getLiveNowCards: build.query<LiveNowCard[], { minUsers?: number } | void>({
      queryFn: async params => {
        try {
          const eventsUrl = getEnv('EVENTS_API_URL')!
          const hotScenesUrl = getEnv('HOT_SCENES_URL')!

          const [eventsRes, scenesRes] = await Promise.all([
            fetch(`${eventsUrl}/events?list=live&limit=20&order=asc&world=false`),
            fetch(hotScenesUrl)
          ])

          if (!eventsRes.ok || !scenesRes.ok) {
            throw new Error('Failed to fetch live events or hot scenes')
          }

          const [eventsData, scenesData]: [EventsResponse, HotScene[]] = await Promise.all([eventsRes.json(), scenesRes.json()])

          const minUsers = params && 'minUsers' in params ? params.minUsers : undefined
          const cards = buildLiveNowCards(eventsData.data ?? [], scenesData, minUsers)
          const enrichedCards = await enrichPlaceCards(cards, {
            placesUrl: getEnv('PLACES_API_URL'),
            peerUrl: getEnv('PEER_URL')
          })

          return { data: enrichedCards }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['LiveNow']
    }),
    getUpcomingEvents: build.query<EventEntry[], GetUpcomingParams>({
      serializeQueryArgs: ({ queryArgs }) => {
        if (queryArgs && 'identity' in queryArgs) {
          const { identity, ...rest } = queryArgs
          return { ...rest, authenticated: Boolean(identity) }
        }
        return { authenticated: false }
      },
      queryFn: async params => {
        try {
          const identity = params && 'identity' in params ? params.identity : undefined
          const baseUrl = getEnv('EVENTS_API_URL')!
          const now = new Date()
          const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          const query = buildQueryString({
            list: 'upcoming',
            limit: 10,
            order: 'asc',
            world: false,
            from: now.toISOString(),
            to: in24h.toISOString()
          })
          const response = await fetchWithOptionalIdentity(`${baseUrl}/events?${query}`, identity)

          if (!response.ok) {
            throw new Error(`Events API error: ${response.status}`)
          }

          const data: EventsResponse = await response.json()
          return { data: data.data ?? [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['Events']
    }),
    createEvent: build.mutation<CreateEventResponse, CreateEventParams>({
      queryFn: async ({ payload, identity }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')!
          const body = JSON.stringify(payload)
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const response = await fetchWithIdentity(`${baseUrl}/events`, identity, 'POST', body, { 'Content-Type': 'application/json' })

          if (!response.ok) {
            const envelope = await response.json().catch(() => null)
            const message = typeof envelope?.error === 'string' ? envelope.error : `Failed to create event (${response.status})`
            console.error('[Events] createEvent failed', response.status, envelope)
            return { error: { status: response.status, data: envelope, message } }
          }

          const data: CreateEventResponse = await response.json()
          return { data }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      invalidatesTags: ['Events']
    }),
    updateEvent: build.mutation<CreateEventResponse, UpdateEventParams>({
      queryFn: async ({ eventId, payload, identity }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')!
          const body = JSON.stringify(payload)
          const response = await fetchWithIdentity(
            `${baseUrl}/events/${encodeURIComponent(eventId)}`,
            identity,
            'PATCH',
            body,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { 'Content-Type': 'application/json' }
          )

          if (!response.ok) {
            const envelope = await response.json().catch(() => null)
            const message = typeof envelope?.error === 'string' ? envelope.error : `Failed to update event (${response.status})`
            console.error('[Events] updateEvent failed', response.status, envelope)
            return { error: { status: response.status, data: envelope, message } }
          }

          const data: CreateEventResponse = await response.json()
          return { data }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      invalidatesTags: ['Events']
    }),
    getWorldNames: build.query<string[], void>({
      queryFn: async () => {
        try {
          const baseUrl = getEnv('PLACES_API_URL')!
          const response = await fetch(`${baseUrl}/world_names`)
          if (!response.ok) {
            throw new Error(`world_names error: ${response.status}`)
          }
          const envelope: { ok?: boolean; data?: string[] } | string[] = await response.json()
          const data = Array.isArray(envelope) ? envelope : envelope.data ?? []
          return { data }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }),
    getCommunities: build.query<CommunityAttributes[], GetCommunitiesParams>({
      serializeQueryArgs: ({ queryArgs: { identity } }) => ({
        address: identity?.authChain?.[0]?.payload?.toLowerCase() ?? 'anon'
      }),
      queryFn: async ({ identity }) => {
        try {
          const baseUrl = getEnv('SOCIAL_API_URL')!
          const url = `${baseUrl}/v1/communities?roles=owner&roles=moderator`
          const response = await fetchWithOptionalIdentity(url, identity)
          if (!response.ok) {
            throw new Error(`communities error: ${response.status}`)
          }
          const envelope: CommunitiesResponse = await response.json()
          const items = envelope.data?.results ?? []
          return { data: items.filter(item => item.active) }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }),
    uploadPoster: build.mutation<PosterData, UploadPosterParams>({
      queryFn: async ({ file, identity }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')!
          const body = new FormData()
          body.append('poster', file)
          const response = await fetchWithIdentity(`${baseUrl}/poster`, identity, 'POST', body)
          if (!response.ok) {
            const errorBody = await response.text()
            console.error('[Events] uploadPoster failed', response.status, errorBody)
            throw new Error('Failed to upload image. Please try again.')
          }
          const envelope: PosterResponse = await response.json()
          return { data: envelope.data }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }),
    uploadPosterVertical: build.mutation<PosterData, UploadPosterParams>({
      queryFn: async ({ file, identity }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')!
          const body = new FormData()
          body.append('poster', file)
          const response = await fetchWithIdentity(`${baseUrl}/poster-vertical`, identity, 'POST', body)
          if (!response.ok) {
            const errorBody = await response.text()
            console.error('[Events] uploadPosterVertical failed', response.status, errorBody)
            throw new Error('Failed to upload vertical image. Please try again.')
          }
          const envelope: PosterResponse = await response.json()
          return { data: envelope.data }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      }
    }),
    toggleAttendee: build.mutation<EventAttendeesResponse, ToggleAttendeeParams>({
      queryFn: async ({ eventId, attending, identity }) => {
        try {
          const baseUrl = getEnv('EVENTS_API_URL')!
          const method = attending ? 'POST' : 'DELETE'
          const encodedId = encodeURIComponent(eventId)
          const response = await fetchWithIdentity(`${baseUrl}/events/${encodedId}/attendees`, identity, method)

          if (!response.ok) {
            throw new Error(`Attendees API error: ${response.status}`)
          }

          const data: EventAttendeesResponse = await response.json()
          return { data }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      invalidatesTags: ['Events']
    })
  })
})

const {
  useCreateEventMutation,
  useGetCommunitiesQuery,
  useGetEventsQuery,
  useGetLiveNowCardsQuery,
  useGetUpcomingEventsQuery,
  useGetWorldNamesQuery,
  useToggleAttendeeMutation,
  useUpdateEventMutation,
  useUploadPosterMutation,
  useUploadPosterVerticalMutation
} = eventsClient

export {
  eventsClient,
  useCreateEventMutation,
  useGetCommunitiesQuery,
  useGetEventsQuery,
  useGetLiveNowCardsQuery,
  useGetUpcomingEventsQuery,
  useGetWorldNamesQuery,
  useToggleAttendeeMutation,
  useUpdateEventMutation,
  useUploadPosterMutation,
  useUploadPosterVerticalMutation
}
