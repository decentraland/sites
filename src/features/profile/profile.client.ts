import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { Profile } from 'dcl-catalyst-client/dist/client/specs/lambdas-client'
import { getEnv } from '../../config/env'

type Entry = {
  data: Profile | null
  loaded: boolean
  fetching: Promise<void> | null
  hasError?: boolean
}

// `hasError` separates "the batch failed" from "still in flight". Both leave the entry
// unloaded so the next subscriber retries, but consumers that gate UI on loading would
// otherwise wait forever on a failure.
type Snapshot = { data: Profile | null; isLoading: boolean; hasError: boolean }

const EMPTY_ENTRY: Entry = { data: null, loaded: false, fetching: null }
const EMPTY_SNAPSHOT: Snapshot = { data: null, isLoading: false, hasError: false }

const entries = new Map<string, Entry>()
const snapshots = new Map<string, Snapshot>()
const listenersByKey = new Map<string, Set<() => void>>()

function snapshotOf(entry: Entry): Snapshot {
  return { data: entry.data, isLoading: !entry.loaded && !entry.hasError, hasError: !!entry.hasError }
}

function notify(key: string) {
  listenersByKey.get(key)?.forEach(fn => fn())
}

function setEntry(key: string, next: Entry) {
  entries.set(key, next)
  snapshots.set(key, snapshotOf(next))
  notify(key)
}

// Cache key encodes the peer URL so an `?env=prd` switch on the same address
// doesn't return the previously-cached zone payload (and vice versa). The
// public `useGetProfileQuery(address)` API stays unchanged; the env scope is
// resolved internally each time a new subscriber attaches.
function buildCacheKey(address: string, peerUrlOverride?: string): string {
  const peerUrl = peerUrlOverride ?? getEnv('PEER_URL') ?? ''
  return `${peerUrl}|${address.toLowerCase()}`
}

// ── Batched fetching ──────────────────────────────────────────────────────
// A grid mount (e.g. /places: ~30 place cards, each resolving its owner via
// useGetProfileQuery) used to fan out one GET /lambdas/profiles/{address} per
// card. Profile fetches requested in the same tick now coalesce into a single
// POST /lambdas/profiles { ids } per peer — the catalyst returns one profile
// wrapper per id that has a deployed profile (missing ids simply aren't in the
// response → resolved as null).
// Sentinel a failed batch settles with — distinct from `null` ("this address
// has no deployed profile") so the entry is NOT cached and a later mount
// retries instead of pinning synthetic avatars for the whole tab session.
const BATCH_FAILED = Symbol('profile-batch-failed')

const pendingByPeer = new Map<string, Map<string, Array<(profile: Profile | null | typeof BATCH_FAILED) => void>>>()

async function flushBatch(peerUrl: string): Promise<void> {
  const resolvers = pendingByPeer.get(peerUrl)
  pendingByPeer.delete(peerUrl)
  if (!resolvers || resolvers.size === 0) return
  const settle = (lookup: (address: string) => Profile | null | typeof BATCH_FAILED) => {
    for (const [address, fns] of resolvers) fns.forEach(fn => fn(lookup(address)))
  }
  try {
    const response = await fetch(`${peerUrl}/lambdas/profiles`, {
      method: 'POST',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...resolvers.keys()] })
    })
    if (!response.ok) {
      console.warn('[profile.client] batch profiles fetch non-ok', { status: response.status })
      settle(() => BATCH_FAILED)
      return
    }
    const list: Profile[] = await response.json()
    // lamb2 >= 4.13.2 pins `ethAddress`/`userId` to the entity pointer, so the claimed
    // address is trustworthy against an up-to-date peer. Bind defensively anyway: the
    // response carries no pointer to check against, and PEER_URL can point at a peer
    // still serving raw deployer metadata. Ignore claims on addresses we did not ask
    // for, and drop a row two entries claim rather than pick one of them.
    const claims = new Map<string, Profile[]>()
    for (const profile of Array.isArray(list) ? list : []) {
      const address = profile?.avatars?.[0]?.ethAddress?.toLowerCase()
      if (!address || !resolvers.has(address)) continue
      claims.set(address, [...(claims.get(address) ?? []), profile])
    }
    settle(address => {
      const claimed = claims.get(address)
      return claimed?.length === 1 ? claimed[0] : null
    })
  } catch (error) {
    console.warn('[profile.client] batch profiles fetch failed', { error })
    settle(() => BATCH_FAILED)
  }
}

function fetchProfile(cacheKey: string): Promise<Profile | null> {
  const [peerUrl, address] = cacheKey.split('|', 2)
  if (!peerUrl || !address) return Promise.resolve(null)
  let resolvers = pendingByPeer.get(peerUrl)
  if (!resolvers) {
    resolvers = new Map()
    pendingByPeer.set(peerUrl, resolvers)
    // First request this tick schedules the flush; the rest of the mount wave
    // piggy-backs on it (cache keys are already lowercased).
    queueMicrotask(() => void flushBatch(peerUrl))
  }
  return new Promise((resolve, reject) => {
    const fns = resolvers.get(address) ?? []
    fns.push(result => (result === BATCH_FAILED ? reject(new Error('profile batch fetch failed')) : resolve(result)))
    resolvers.set(address, fns)
  })
}

function ensureFetch(key: string): Promise<void> {
  const existing = entries.get(key) ?? EMPTY_ENTRY
  if (existing.loaded || existing.fetching) return existing.fetching ?? Promise.resolve()

  const promise = (async () => {
    try {
      const data = await fetchProfile(key)
      setEntry(key, { data, loaded: true, fetching: null })
    } catch {
      // Transient failure — leave the entry UNcached (`loaded: false`) so the
      // next subscriber retries instead of freezing a null profile all session.
      setEntry(key, { data: null, loaded: false, fetching: null, hasError: true })
    }
  })()

  // Clear any previous failure: while this retry is in flight the entry is loading,
  // not errored, so callers show a spinner instead of staying in the error path.
  setEntry(key, { ...existing, fetching: promise, hasError: false })
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
  const pending: Snapshot = { data: null, isLoading: true, hasError: false }
  snapshots.set(key, pending)
  return pending
}

type QueryOptions = { skip?: boolean; peerUrl?: string }

function useGetProfileQuery(address: string | undefined, options: QueryOptions = {}): Snapshot {
  const key = options.skip || !address ? '' : buildCacheKey(address, options.peerUrl)

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
  return useBatchProfileField(addresses, snapshot => snapshot.data?.avatars?.[0]?.name)
}

function useGetProfilePictures(addresses: readonly string[]): Map<string, string | undefined> {
  return useBatchProfileField(addresses, snapshot => snapshot.data?.avatars?.[0]?.avatar?.snapshots?.face256)
}

// Per-address snapshots rather than one extracted field, so callers can tell a resolved
// profile from one still in flight or one whose batch failed.
function useGetProfileSnapshots(addresses: readonly string[], peerUrl?: string): Map<string, Snapshot | undefined> {
  return useBatchProfileField(addresses, snapshot => snapshot, peerUrl)
}

function useBatchProfileField<T>(
  addresses: readonly string[],
  extract: (snapshot: Snapshot) => T | undefined,
  peerUrl?: string
): Map<string, T | undefined> {
  const keysSignature = useMemo(
    () =>
      Array.from(new Set(addresses.map(address => buildCacheKey(address, peerUrl))))
        .sort()
        .join('\n'),
    [addresses, peerUrl]
  )
  const [values, setValues] = useState<Map<string, T | undefined>>(() => new Map())
  const extractRef = useRef(extract)
  extractRef.current = extract

  useEffect(() => {
    const keys = keysSignature ? keysSignature.split('\n') : []
    if (keys.length === 0) {
      setValues(prev => (prev.size === 0 ? prev : new Map()))
      return
    }
    const update = () => {
      setValues(prev => {
        const next = new Map<string, T | undefined>()
        for (const key of keys) {
          const address = key.split('|', 2)[1] ?? key
          next.set(address, extractRef.current(getSnapshotFor(key)))
        }
        if (next.size === prev.size && Array.from(next.keys()).every(addr => next.get(addr) === prev.get(addr))) return prev
        return next
      })
    }
    const unsubscribers = keys.map(key => subscribeTo(key, update))
    update()
    return () => unsubscribers.forEach(unsubscribe => unsubscribe())
  }, [keysSignature])

  return values
}

export { useGetProfileQuery, useGetProfileNames, useGetProfilePictures, useGetProfileSnapshots, type Profile, type Snapshot }
