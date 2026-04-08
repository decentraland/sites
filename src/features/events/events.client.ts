import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../config/env'
import type { EventEntry, EventsResponse, HotScene } from './events.types'

interface ExploreData {
  liveEvents: EventEntry[]
  hotScenes: HotScene[]
}

const eventsClient = createApi({
  reducerPath: 'eventsClient',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Explore'],
  keepUnusedDataFor: 60,
  endpoints: build => ({
    getExploreData: build.query<ExploreData, void>({
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
      providesTags: ['Explore']
    })
  })
})

const { useGetExploreDataQuery } = eventsClient

export { eventsClient, useGetExploreDataQuery }
export type { ExploreData }
