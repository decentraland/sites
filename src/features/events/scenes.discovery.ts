import { useSyncExternalStore } from 'react'
import { getEnv } from '../../config/env'
import type { HotScene } from './events.discovery.types'

const FETCH_TIMEOUT_MS = 10_000

// Plain-fetch client for the raw hot-scenes feed. The explore-cards pipeline in
// events.discovery trims this data hard (>=5 users, 3 cards total) for the
// homepage rail; consumers that want the full occupied-scenes list read it here.

async function fetchHotScenes(): Promise<HotScene[]> {
  const hotScenesUrl = getEnv('HOT_SCENES_URL') || 'https://realm-provider-ea.decentraland.org/hot-scenes'
  const response = await fetch(hotScenesUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!response.ok) return []
  const scenes = (await response.json()) as HotScene[]
  return Array.isArray(scenes) ? scenes : []
}

type HotScenesSnapshot = { data: HotScene[]; isLoading: boolean }

let snapshot: HotScenesSnapshot = { data: [], isLoading: true }
const listeners = new Set<() => void>()
let subscribers = 0
let activeFetch: Promise<void> | null = null

function commit(data: HotScene[]) {
  snapshot = { data, isLoading: false }
  listeners.forEach(listener => listener())
}

function runFetch(): Promise<void> {
  if (activeFetch) return activeFetch
  const promise = fetchHotScenes()
    .then(commit)
    .catch(() => commit([]))
    .finally(() => {
      activeFetch = null
    })
  activeFetch = promise
  return promise
}

function subscribe(listener: () => void): () => void {
  if (listeners.has(listener)) return () => unsubscribe(listener)
  listeners.add(listener)
  subscribers += 1
  // Refetch when the surface regains its first consumer (stale-while-revalidate);
  // per-visit freshness is enough for a marketing section, so no polling.
  if (subscribers === 1) void runFetch()
  return () => unsubscribe(listener)
}

function unsubscribe(listener: () => void): void {
  if (!listeners.has(listener)) return
  listeners.delete(listener)
  subscribers -= 1
}

function useGetHotScenesQuery(): HotScenesSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function getSnapshot(): HotScenesSnapshot {
  return snapshot
}

export { useGetHotScenesQuery }
