import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../config/env'
import { buildExploreCards } from './events.helpers'
import type { EventsResponse, ExploreItem, HotScene } from './events.types'

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
    getExploreData: build.query<ExploreItem[], void>({
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

          const cards = buildExploreCards(liveEvents, hotScenes)

          const peerUrl = getEnv('PEER_URL')
          if (peerUrl) {
            const placeCards = cards.filter(c => c.type === 'place' && !c.creatorAddress)
            await Promise.all(
              placeCards.map(card =>
                fetch(`${peerUrl}/content/entities/active`, {
                  method: 'POST',
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pointers: [card.coordinates] })
                })
                  .then(res => (res.ok ? res.json() : null))
                  .then(entities => {
                    const entityId = entities?.[0]?.id
                    if (entityId) {
                      return fetch(`${peerUrl}/content/deployments/?entityId=${entityId}`).then(res => (res.ok ? res.json() : null))
                    }
                    return null
                  })
                  .then(deploymentData => {
                    const deployedBy = deploymentData?.deployments?.[0]?.deployedBy
                    if (deployedBy) {
                      card.creatorAddress = deployedBy
                    }
                  })
                  .catch(() => {})
              )
            )
          }

          return { data: cards }
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
