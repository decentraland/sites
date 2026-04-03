import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../config/env'
import type { EventEntry, EventsResponse, HotScene } from './events.types'

interface WhatsOnData {
  liveEvents: EventEntry[]
  hotScenes: HotScene[]
}

const eventsClient = createApi({
  reducerPath: 'eventsClient',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['WhatsOn'],
  keepUnusedDataFor: 60,
  endpoints: build => ({
    getWhatsOnData: build.query<WhatsOnData, void>({
      queryFn: async () => {
        try {
          const eventsApiUrl = getEnv('EVENTS_API_URL') || 'https://events.decentraland.org/api'
          const hotScenesUrl = getEnv('HOT_SCENES_URL') || 'https://realm-provider-ea.decentraland.org/hot-scenes'

          const [eventsResult, scenesResult] = await Promise.allSettled([
            fetch(`${eventsApiUrl}/events?list=live&limit=20&order=asc&world=false`),
            fetch(hotScenesUrl)
          ])

          let liveEvents: EventEntry[] = []
          let hotScenes: HotScene[] = []

          if (eventsResult.status === 'fulfilled' && eventsResult.value.ok) {
            const contentType = eventsResult.value.headers.get('content-type')
            if (contentType?.includes('application/json')) {
              const eventsData: EventsResponse = await eventsResult.value.json()
              liveEvents = eventsData.data ?? []
            }
          }

          if (scenesResult.status === 'fulfilled' && scenesResult.value.ok) {
            const contentType = scenesResult.value.headers.get('content-type')
            if (contentType?.includes('application/json')) {
              hotScenes = await scenesResult.value.json()
            }
          }

          return {
            data: {
              liveEvents,
              hotScenes
            }
          }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['WhatsOn']
    })
  })
})

const { useGetWhatsOnDataQuery } = eventsClient

export { eventsClient, useGetWhatsOnDataQuery }
export type { WhatsOnData }
