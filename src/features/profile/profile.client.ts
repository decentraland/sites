import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { Profile } from 'dcl-catalyst-client/dist/client/specs/lambdas-client'
import { getEnv } from '../../config/env'

type Entry = {
  data: Profile | null
  loaded: boolean
  fetching: Promise<void> | null
}

type Snapshot = { data: Profile | null; isLoading: boolean }

const EMPTY_ENTRY: Entry = { data: null, loaded: false, fetching: null }
const EMPTY_SNAPSHOT: Snapshot = { data: null, isLoading: false }

const entries = new Map<string, Entry>()
const snapshots = new Map<string, Snapshot>()
const listenersByKey = new Map<string, Set<() => void>>()

function snapshotOf(entry: Entry): Snapshot {
  return { data: entry.data, isLoading: !entry.loaded }
}

function notify(key: string) {
  listenersByKey.get(key)?.forEach(fn => fn())
}

function setEntry(key: string, next: Entry) {
  entries.set(key, next)
  snapshots.set(key, snapshotOf(next))
  notify(key)
}

async function fetchProfile(address: string): Promise<Profile | null> {
  try {
    const peerUrl = getEnv('PEER_URL')
    const response = await fetch(`${peerUrl}/lambdas/profiles/${address.toLowerCase()}`)
    const data = await response.json()
    return data ?? null
  } catch {
    return null
  }
}

function ensureFetch(key: string): Promise<void> {
  const existing = entries.get(key) ?? EMPTY_ENTRY
  if (existing.loaded || existing.fetching) return existing.fetching ?? Promise.resolve()

  const promise = (async () => {
    try {
      const data = await fetchProfile(key)
      setEntry(key, { data, loaded: true, fetching: null })
    } catch {
      setEntry(key, { data: null, loaded: true, fetching: null })
    }
  })()

  setEntry(key, { ...existing, fetching: promise })
  return promise
}

function subscribeTo(key: string, listener: () => void): () => void {
  let set = listenersByKey.get(key)
  if (!set) {
    set = new Set()
    listenersByKey.set(key, set)
  }
  set.add(listener)
  void ensureFetch(key)
  return () => {
    set.delete(listener)
    if (set.size === 0) listenersByKey.delete(key)
  }
}

function getSnapshotFor(key: string): Snapshot {
  const snap = snapshots.get(key)
  if (snap) return snap
  // Seed a stable pending snapshot so useSyncExternalStore doesn't loop.
  const pending: Snapshot = { data: null, isLoading: true }
  snapshots.set(key, pending)
  return pending
}

type QueryOptions = { skip?: boolean }

function useGetProfileQuery(address: string | undefined, options: QueryOptions = {}): Snapshot {
  const key = options.skip || !address ? '' : address.toLowerCase()

  const subscribe = useCallback(
    (listener: () => void) => {
      if (!key) return () => undefined
      return subscribeTo(key, listener)
    },
    [key]
  )

  const getSnapshot = useCallback(() => {
    if (!key) return EMPTY_SNAPSHOT
    return getSnapshotFor(key)
  }, [key])

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function useGetProfileNames(addresses: readonly string[]): Map<string, string | undefined> {
  const keysSignature = useMemo(
    () =>
      Array.from(new Set(addresses.map(address => address.toLowerCase())))
        .sort()
        .join('|'),
    [addresses]
  )
  const [names, setNames] = useState<Map<string, string | undefined>>(() => new Map())

  useEffect(() => {
    const keys = keysSignature ? keysSignature.split('|') : []
    if (keys.length === 0) {
      setNames(prev => (prev.size === 0 ? prev : new Map()))
      return
    }
    const update = () => {
      setNames(prev => {
        const next = new Map<string, string | undefined>()
        for (const key of keys) next.set(key, getSnapshotFor(key).data?.avatars?.[0]?.name)
        if (next.size === prev.size && keys.every(key => next.get(key) === prev.get(key))) return prev
        return next
      })
    }
    const unsubscribers = keys.map(key => subscribeTo(key, update))
    update()
    return () => unsubscribers.forEach(unsubscribe => unsubscribe())
  }, [keysSignature])

  return names
}

export { useGetProfileQuery, useGetProfileNames, type Profile }
