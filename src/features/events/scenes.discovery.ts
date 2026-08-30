import { useSyncExternalStore } from 'react'
import { getEnv } from '../../config/env'
import { isDocumentVisible, subscribeVisibility } from '../../utils/documentVisibility'
import { timeoutSignal } from '../../utils/timeoutSignal'
import type { HotScene } from './events.discovery.types'

const FETCH_TIMEOUT_MS = 10_000

// Presence badges built from this feed link into /places/place/…, where the
// detail page re-reads the same feed on arrival. Scene populations are small
// enough to drain within minutes, so the snapshot revalidates on the shared
// visible-tab cadence (events.discovery, whats-on LiveNow) instead of freezing
// at whatever the first fetch saw — a frozen "N online" card would routinely
// contradict the page it links to.
const POLL_INTERVAL_MS = 60_000

// Plain-fetch client for the raw hot-scenes feed. The explore-cards pipeline in
// events.discovery trims this data hard (>=5 users, 3 cards total) for the
// homepage rail; consumers that want the full occupied-scenes list read it here.

async function fetchHotScenes(): Promise<HotScene[]> {
  const hotScenesUrl = getEnv('HOT_SCENES_URL') || 'https://realm-provider-ea.decentraland.org/hot-scenes'
  const response = await fetch(hotScenesUrl, { signal: timeoutSignal(FETCH_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`hot-scenes responded ${response.status}`)
  const scenes = (await response.json()) as HotScene[]
  if (!Array.isArray(scenes)) throw new Error('hot-scenes payload is not an array')
  return scenes
}

type HotScenesSnapshot = { data: HotScene[]; isLoading: boolean }

let snapshot: HotScenesSnapshot = { data: [], isLoading: true }
const listeners = new Set<() => void>()
let subscribers = 0
let activeFetch: Promise<void> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let unsubscribeVisibility: (() => void) | null = null

function commit(data: HotScene[]) {
  snapshot = { data, isLoading: false }
  listeners.forEach(listener => listener())
}

function runFetch(): Promise<void> {
  if (activeFetch) return activeFetch
  const promise = fetchHotScenes()
    .then(commit)
    // A failed fetch or bad payload keeps the last good snapshot on screen
    // (events.discovery does the same): a transient error on a poll tick must
    // not blank the section. On a virgin store this still settles to an empty
    // list so consumers leave their loading state.
    .catch(() => commit(snapshot.data))
    .finally(() => {
      activeFetch = null
    })
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
  // Refetch when the surface regains its first consumer (stale-while-revalidate),
  // then keep the snapshot live while the tab stays visible.
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

function useGetHotScenesQuery(): HotScenesSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function getSnapshot(): HotScenesSnapshot {
  return snapshot
}

export { useGetHotScenesQuery }
