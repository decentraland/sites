import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../../config/env'
import { buildExploreCards } from './events.helpers'
import { ExploreCardType } from './events.types'
import type { EventsResponse, ExploreItem, HotScene } from './events.types'

// #3 — Typed Peer API responses
interface ActiveEntity {
  id: string
  pointers: string[]
}

interface DeploymentResponse {
  deployments: { deployedBy: string }[]
}

// #8 — Cache deployer addresses across poll cycles (coordinates → address)
const deployerCache = new Map<string, string>()

// #10 — Shared timeout for peer fetches
const PEER_TIMEOUT_MS = 5000

function createPeerSignal(): AbortSignal {
  return AbortSignal.timeout(PEER_TIMEOUT_MS)
}

// #9 — Extracted helper for deployer resolution
async function resolveDeployers(peerUrl: string, coordinates: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  const uncached = coordinates.filter(c => {
    const cached = deployerCache.get(c)
    if (cached) result.set(c, cached)
    return !cached
  })

  if (uncached.length === 0) return result

  // #2 — Batch all pointers in a single request
  const entities: ActiveEntity[] = await fetch(`${peerUrl}/content/entities/active`, {
    method: 'POST',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pointers: uncached }),
    signal: createPeerSignal()
  }).then(res => (res.ok ? res.json() : []))

  // #4 — Encode entityId in URL
  const deploymentResults = await Promise.all(
    entities.map(entity =>
      fetch(`${peerUrl}/content/deployments/?entityId=${encodeURIComponent(entity.id)}`, { signal: createPeerSignal() })
        .then(res => (res.ok ? (res.json() as Promise<DeploymentResponse>) : null))
        .then(data => ({ pointers: entity.pointers, deployedBy: data?.deployments?.[0]?.deployedBy }))
        // #5 — Log failures instead of swallowing
        .catch((err: unknown) => {
          console.warn('[Explore] deployment lookup failed for entity', entity.id, err)
          return null
        })
    )
  )

  for (const entry of deploymentResults) {
    if (entry?.deployedBy) {
      for (const pointer of entry.pointers) {
        result.set(pointer, entry.deployedBy)
        deployerCache.set(pointer, entry.deployedBy)
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
      // #1 — Enrichment runs after cards are returned, without blocking render
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data: cards } = await queryFulfilled
          const peerUrl = getEnv('PEER_URL')
          if (!peerUrl) return

          // #7 — Use enum instead of string literal
          const placeCoords = cards.filter(c => c.type === ExploreCardType.PLACE && !c.creatorAddress).map(c => c.coordinates)
          if (placeCoords.length === 0) return

          const deployerMap = await resolveDeployers(peerUrl, placeCoords)
          if (deployerMap.size === 0) return

          // #6 — Immutable update via RTK's updateQueryData
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
          // #5 — Log failures
          console.warn('[Explore] deployer enrichment failed', err)
        }
      }
    })
  })
})

const { useGetExploreDataQuery } = eventsClient

export { eventsClient, useGetExploreDataQuery }
