import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../config/env'
import type { EventEntry, EventsResponse, HotScene } from './events.types'

interface ExploreData {
  liveEvents: EventEntry[]
  hotScenes: HotScene[]
}

async function extractJson<T>(result: PromiseSettledResult<Response>): Promise<T | null> {
  if (result.status !== 'fulfilled' || !result.value.ok) {
    return null
  }

  const contentType = result.value.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return null
  }

  return result.value.json()
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

          const [eventsResult, scenesResult] = await Promise.allSettled([
            fetch(`${eventsApiUrl}/events?list=live&limit=20&order=asc&world=false`),
            fetch(hotScenesUrl)
          ])

          const eventsData = await extractJson<EventsResponse>(eventsResult)
          const liveEvents = eventsData?.data ?? []

          const hotScenes = (await extractJson<HotScene[]>(scenesResult)) ?? []

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
      providesTags: ['Explore']
    })
  })
})

const { useGetExploreDataQuery } = eventsClient

export { eventsClient, useGetExploreDataQuery }
export type { ExploreData }
