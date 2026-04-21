import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../config/env'
import { fetchWithIdentity, fetchWithOptionalIdentity } from '../../utils/signedFetch'
import { buildLiveNowCards, enrichPlaceCards } from './events.helpers'
import type { HotScene, LiveNowCard } from './events.helpers'
import type {
  AuthenticatedQueryParams,
  CreateEventParams,
  CreateEventResponse,
  EventAttendeesResponse,
  EventEntry,
  EventsQueryParams,
  EventsResponse,
  ToggleAttendeeParams
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
            placesUrl: getEnv('PLACES_API_URL')
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
            const errorBody = await response.text()
            console.error('[Events] createEvent failed', response.status, errorBody)
            throw new Error('Failed to create event. Please try again.')
          }

          const data: CreateEventResponse = await response.json()
          return { data }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      invalidatesTags: ['Events']
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

const { useCreateEventMutation, useGetEventsQuery, useGetLiveNowCardsQuery, useGetUpcomingEventsQuery, useToggleAttendeeMutation } =
  eventsClient

export {
  eventsClient,
  useCreateEventMutation,
  useGetEventsQuery,
  useGetLiveNowCardsQuery,
  useGetUpcomingEventsQuery,
  useToggleAttendeeMutation
}
