import { useSyncExternalStore } from 'react'
import { getEnv } from '../../config/env'
import { isDocumentVisible, subscribeVisibility } from '../../utils/documentVisibility'
import { resolveDeployers } from '../../utils/peerDeployers'
import { buildExploreCards } from './events.helpers'
import { ExploreCardType } from './events.types'
import type { EventsResponse, ExploreItem, HotScene } from './events.types'

const POLL_INTERVAL_MS = 60_000

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
        console.warn('[WhatsOn] deployer enrichment failed', err)
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

function useGetWhatsOnDataQuery(): ExploreSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export { useGetWhatsOnDataQuery }
