import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../config/env'
import type { EventEntry, EventsResponse, HotScene } from './events.types'

interface WhatsOnData {
  liveEvents: EventEntry[]
  hotScenes: HotScene[]
}

const UPCOMING_EVENTS_LIMIT = 3

const eventsClient = createApi({
  reducerPath: 'eventsClient',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['WhatsOn', 'UpcomingEvents'],
  keepUnusedDataFor: 60,
  endpoints: build => ({
    getWhatsOnData: build.query<WhatsOnData, void>({
      queryFn: async () => {
        try {
          const eventsApiUrl = getEnv('EVENTS_API_URL') || 'https://events.decentraland.org/api'
          const hotScenesUrl = getEnv('HOT_SCENES_URL') || 'https://realm-provider-ea.decentraland.org/hot-scenes'

          const [eventsRes, scenesRes] = await Promise.all([
            fetch(`${eventsApiUrl}/events?list=live&limit=20&order=asc&world=false`),
            fetch(hotScenesUrl)
          ])

          if (!eventsRes.ok || !scenesRes.ok) {
            throw new Error('Failed to fetch events or hot scenes')
          }

          const [eventsData, scenesData]: [EventsResponse, HotScene[]] = await Promise.all([eventsRes.json(), scenesRes.json()])

          return {
            data: {
              liveEvents: eventsData.data ?? [],
              hotScenes: scenesData
            }
          }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['WhatsOn']
    }),
    getUpcomingEvents: build.query<EventEntry[], void>({
      queryFn: async () => {
        try {
          const eventsApiUrl = getEnv('EVENTS_API_URL') || 'https://events.decentraland.org/api'
          const res = await fetch(`${eventsApiUrl}/events?list=upcoming&limit=${UPCOMING_EVENTS_LIMIT}&order=asc&world=false`)
          if (!res.ok) {
            throw new Error('Failed to fetch upcoming events')
          }
          const data: EventsResponse = await res.json()
          return { data: data.data ?? [] }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['UpcomingEvents']
    })
  })
})

const { useGetWhatsOnDataQuery, useGetUpcomingEventsQuery } = eventsClient

export { eventsClient, useGetUpcomingEventsQuery, useGetWhatsOnDataQuery }
export type { WhatsOnData }
