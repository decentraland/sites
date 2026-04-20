import { useSyncExternalStore } from 'react'
import { getEnv } from '../../config/env'
import { isDocumentVisible, subscribeVisibility } from '../../utils/documentVisibility'
import { buildExploreCards } from './events.helpers'
import { ExploreCardType } from './events.types'
import type { ActiveEntity, EventsResponse, ExploreItem, HotScene } from './events.types'

const POLL_INTERVAL_MS = 60_000
const DEPLOYER_BATCH_TIMEOUT_MS = 5_000

interface DeploymentEntry {
  entityId: string
  deployedBy: string
}

interface DeploymentResponse {
  deployments: DeploymentEntry[]
}

async function resolveDeployers(peerUrl: string, coordinates: string[]): Promise<Map<string, string>> {
  const signal = AbortSignal.timeout(DEPLOYER_BATCH_TIMEOUT_MS)
  const result = new Map<string, string>()
  const coordinatesSet = new Set(coordinates)

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
        if (coordinatesSet.has(pointer)) {
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

async function fetchExploreCards(): Promise<ExploreItem[]> {
  const eventsApiUrl = getEnv('EVENTS_API_URL') || 'https://events.decentraland.org/api'
  const hotScenesUrl = getEnv('HOT_SCENES_URL') || 'https://realm-provider-ea.decentraland.org/hot-scenes'

  const [eventsResult, scenesResult] = await Promise.allSettled([
    fetch(`${eventsApiUrl}/events?list=live&limit=20&order=asc&world=false`),
    fetch(hotScenesUrl)
  ])

  const eventsData = await extractJson<EventsResponse>(eventsResult)
  const liveEvents = eventsData?.data ?? []
  const hotScenes = (await extractJson<HotScene[]>(scenesResult)) ?? []

  return buildExploreCards(liveEvents, hotScenes)
}

async function enrichWithDeployers(cards: ExploreItem[]): Promise<ExploreItem[] | null> {
  const peerUrl = getEnv('PEER_URL')
  if (!peerUrl) return null

  const placeCoords = cards.filter(c => c.type === ExploreCardType.PLACE && !c.creatorAddress).map(c => c.coordinates)
  if (placeCoords.length === 0) return null

  const deployerMap = await resolveDeployers(peerUrl, placeCoords)
  if (deployerMap.size === 0) return null

  return cards.map(card => {
    const deployedBy = deployerMap.get(card.coordinates)
    return deployedBy && !card.creatorAddress ? { ...card, creatorAddress: deployedBy } : card
  })
}

type ExploreState = {
  data: ExploreItem[]
  error: Error | null
  loaded: boolean
}

type ExploreSnapshot = { data: ExploreItem[]; isLoading: boolean }

let state: ExploreState = { data: [], error: null, loaded: false }
let snapshot: ExploreSnapshot = { data: state.data, isLoading: true }
const listeners = new Set<() => void>()
let subscribers = 0
let pollTimer: ReturnType<typeof setInterval> | null = null
let activeFetch: Promise<void> | null = null

function commit(next: ExploreState) {
  state = next
  snapshot = { data: state.data, isLoading: !state.loaded }
  listeners.forEach(fn => fn())
}

async function runFetch(): Promise<void> {
  if (activeFetch) return activeFetch
  const promise = (async () => {
    try {
      const cards = await fetchExploreCards()
      commit({ data: cards, error: null, loaded: true })
      try {
        const enriched = await enrichWithDeployers(cards)
        if (enriched) commit({ data: enriched, error: null, loaded: true })
      } catch (err) {
        console.warn('[Explore] deployer enrichment failed', err)
      }
    } catch (err) {
      commit({ data: state.data, error: err instanceof Error ? err : new Error(String(err)), loaded: true })
    } finally {
      activeFetch = null
    }
  })()
  activeFetch = promise
  return promise
}

function startPolling() {
  if (pollTimer) return
  if (!isDocumentVisible()) return
  pollTimer = setInterval(() => {
    void runFetch()
  }, POLL_INTERVAL_MS)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

let unsubscribeVisibility: (() => void) | null = null

function handleVisibility(visible: boolean) {
  if (subscribers === 0) return
  if (!visible) {
    stopPolling()
  } else {
    void runFetch()
    startPolling()
  }
}

function subscribe(listener: () => void): () => void {
  if (listeners.has(listener)) return () => unsubscribe(listener)
  listeners.add(listener)
  subscribers += 1
  if (subscribers === 1) {
    void runFetch()
    startPolling()
    unsubscribeVisibility = subscribeVisibility(handleVisibility)
  }
  return () => unsubscribe(listener)
}

function unsubscribe(listener: () => void): void {
  if (!listeners.has(listener)) return
  listeners.delete(listener)
  subscribers -= 1
  if (subscribers === 0) {
    stopPolling()
    unsubscribeVisibility?.()
    unsubscribeVisibility = null
  }
}

function getSnapshot(): ExploreSnapshot {
  return snapshot
}

function useGetExploreDataQuery(): ExploreSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export { useGetExploreDataQuery }
