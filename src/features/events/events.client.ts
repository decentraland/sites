import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../config/env'
import { buildExploreCards } from './events.helpers'
import { ExploreCardType } from './events.types'
import type { EventsResponse, ExploreItem, HotScene } from './events.types'

interface ActiveEntity {
  id: string
  pointers: string[]
}

interface DeploymentEntry {
  entityId: string
  deployedBy: string
}

interface DeploymentResponse {
  deployments: DeploymentEntry[]
}

async function resolveDeployers(peerUrl: string, coordinates: string[]): Promise<Map<string, string>> {
  const signal = AbortSignal.timeout(5000)
  const result = new Map<string, string>()

  const entities = await fetch(`${peerUrl}/content/entities/active`, {
    method: 'POST',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pointers: coordinates }),
    signal
  }).then(res => {
    if (!res.ok) {
      console.warn('[Explore] active entities batch failed', res.status)
      return [] as ActiveEntity[]
    }
    return res.json() as Promise<ActiveEntity[]>
  })

  if (entities.length === 0) return result

  const params = new URLSearchParams()
  for (const entity of entities) params.append('entityId', entity.id)

  const deploymentData = await fetch(`${peerUrl}/content/deployments/?${params}`, { signal })
    .then(res => {
      if (!res.ok) {
        console.warn('[Explore] deployments batch failed', res.status)
        return null
      }
      return res.json() as Promise<DeploymentResponse>
    })
    .catch((err: unknown) => {
      console.warn('[Explore] deployments batch failed', err)
      return null
    })

  if (!deploymentData) return result

  const deployerByEntityId = new Map<string, string>()
  for (const deployment of deploymentData.deployments) {
    if (deployment.deployedBy && deployment.entityId) {
      deployerByEntityId.set(deployment.entityId, deployment.deployedBy)
    }
  }

  for (const entity of entities) {
    const deployedBy = deployerByEntityId.get(entity.id)
    if (deployedBy) {
      for (const pointer of entity.pointers) {
        if (coordinates.includes(pointer)) {
          result.set(pointer, deployedBy)
        }
      }
    }
  }

  return result
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

          return { data: buildExploreCards(liveEvents, hotScenes) }
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Unknown error' } }
        }
      },
      providesTags: ['Explore'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data: cards } = await queryFulfilled
          const peerUrl = getEnv('PEER_URL')
          if (!peerUrl) return

          const placeCoords = cards.filter(c => c.type === ExploreCardType.PLACE && !c.creatorAddress).map(c => c.coordinates)
          if (placeCoords.length === 0) return

          const deployerMap = await resolveDeployers(peerUrl, placeCoords)
          if (deployerMap.size === 0) return

          dispatch(
            eventsClient.util.updateQueryData('getExploreData', undefined, draft => {
              for (const card of draft) {
                const deployedBy = deployerMap.get(card.coordinates)
                if (deployedBy && !card.creatorAddress) {
                  card.creatorAddress = deployedBy
                }
              }
            })
          )
        } catch (err) {
          console.warn('[Explore] deployer enrichment failed', err)
        }
      }
    })
  })
})

const { useGetExploreDataQuery } = eventsClient

export { eventsClient, useGetExploreDataQuery }
