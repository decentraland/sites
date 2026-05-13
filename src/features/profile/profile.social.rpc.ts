import { useCallback, useEffect, useState } from 'react'
import type { AuthIdentity } from '@dcl/crypto'
import { createSocialClientV2 } from '@dcl/social-rpc-client'
import { FriendshipStatus as RpcFriendshipStatus } from '@dcl/social-rpc-client/dist/protobuff-types/decentraland/social_service/v2/social_service_v2.gen'
import type { FriendProfile } from '@dcl/social-rpc-client/dist/protobuff-types/decentraland/social_service/v2/social_service_v2.gen'
import { getEnv } from '../../config/env'
import { useAuthIdentity } from '../../hooks/useAuthIdentity'

type Client = ReturnType<typeof createSocialClientV2>

type FriendshipStatus = 'none' | 'request_sent' | 'request_received' | 'accepted' | 'blocked'

type FriendshipAction = 'request' | 'cancel' | 'accept' | 'reject' | 'remove'

const RPC_TO_STATUS: Record<number, FriendshipStatus> = {
  [RpcFriendshipStatus.REQUEST_SENT]: 'request_sent',
  [RpcFriendshipStatus.REQUEST_RECEIVED]: 'request_received',
  [RpcFriendshipStatus.ACCEPTED]: 'accepted',
  [RpcFriendshipStatus.BLOCKED]: 'blocked'
}

function toFriendshipStatus(rpcStatus: number): FriendshipStatus {
  return RPC_TO_STATUS[rpcStatus] ?? 'none'
}

function getSocialRpcUrl(): string {
  const url = getEnv('SOCIAL_RPC_URL')
  if (!url) throw new Error('SOCIAL_RPC_URL environment variable is not set')
  return url
}

function identityKey(identity: AuthIdentity): string {
  const owner = identity.authChain?.[0]?.payload
  return typeof owner === 'string' ? owner.toLowerCase() : ''
}

// Singleton client, reset when the authed identity changes (sign-out + sign-in
// with a different wallet). Connection is lazy — established on first call.
let client: Client | null = null
let clientIdentityKey: string | null = null
let connectPromise: Promise<Client> | null = null

async function getClient(identity: AuthIdentity): Promise<Client> {
  const key = identityKey(identity)
  if (client && clientIdentityKey === key) return client
  if (connectPromise) {
    const existing = await connectPromise
    if (clientIdentityKey === key) return existing
  }
  if (client) {
    try {
      client.disconnect()
    } catch {
      /* swallow — connection may already be dropped */
    }
    client = null
    clientIdentityKey = null
    statusCache.clear()
    notifyAll()
  }
  connectPromise = (async () => {
    const next = createSocialClientV2(getSocialRpcUrl())
    await next.connect(identity)
    client = next
    clientIdentityKey = key
    return next
  })()
  try {
    return await connectPromise
  } finally {
    connectPromise = null
  }
}

const statusCache = new Map<string, FriendshipStatus>()
const subscribers = new Map<string, Set<() => void>>()

function notify(address: string) {
  subscribers.get(address)?.forEach(cb => cb())
}

function notifyAll() {
  subscribers.forEach(set => set.forEach(cb => cb()))
}

function subscribe(address: string, listener: () => void): () => void {
  let set = subscribers.get(address)
  if (!set) {
    set = new Set()
    subscribers.set(address, set)
  }
  set.add(listener)
  return () => {
    set.delete(listener)
    if (set.size === 0) subscribers.delete(address)
  }
}

async function fetchStatus(identity: AuthIdentity, address: string): Promise<FriendshipStatus> {
  const key = address.toLowerCase()
  const c = await getClient(identity)
  const response = await c.getFriendshipStatus(key)
  const status = toFriendshipStatus(response.status)
  statusCache.set(key, status)
  notify(key)
  return status
}

async function applyAction(identity: AuthIdentity, address: string, action: FriendshipAction): Promise<FriendshipStatus> {
  const key = address.toLowerCase()
  const c = await getClient(identity)
  switch (action) {
    case 'request':
      await c.requestFriendship(key)
      break
    case 'cancel':
      await c.cancelFriendshipRequest(key)
      break
    case 'accept':
      await c.acceptFriendshipRequest(key)
      break
    case 'reject':
      await c.rejectFriendshipRequest(key)
      break
    case 'remove':
      await c.removeFriendship(key)
      break
  }
  return fetchStatus(identity, address)
}

interface UseFriendshipStatusResult {
  status: FriendshipStatus | undefined
  isLoading: boolean
  error: Error | null
}

function useFriendshipStatus(address: string | undefined): UseFriendshipStatusResult {
  const { identity } = useAuthIdentity()
  const [, setTick] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!address || !identity) {
      setIsLoading(false)
      setError(null)
      return undefined
    }
    const key = address.toLowerCase()
    const unsubscribe = subscribe(key, () => setTick(t => t + 1))

    if (!statusCache.has(key)) {
      setIsLoading(true)
      setError(null)
      let cancelled = false
      void fetchStatus(identity, key)
        .catch(err => {
          if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
      return () => {
        cancelled = true
        unsubscribe()
      }
    }
    return unsubscribe
  }, [address, identity])

  const status = address ? statusCache.get(address.toLowerCase()) : undefined
  return { status, isLoading, error }
}

const friendsCountCache = new Map<string, number>()
const friendsCountSubscribers = new Map<string, Set<() => void>>()

function notifyFriendsCount(key: string) {
  friendsCountSubscribers.get(key)?.forEach(cb => cb())
}

async function fetchFriendsCount(identity: AuthIdentity): Promise<number> {
  const key = identityKey(identity)
  const c = await getClient(identity)
  const response = await c.getFriends({ limit: 1, offset: 0 })
  const total = response.paginationData?.total ?? response.friends?.length ?? 0
  friendsCountCache.set(key, total)
  notifyFriendsCount(key)
  return total
}

interface UseFriendsCountResult {
  count: number | undefined
  isLoading: boolean
  error: Error | null
}

function useFriendsCount(): UseFriendsCountResult {
  const { identity } = useAuthIdentity()
  const [, setTick] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!identity) {
      setIsLoading(false)
      setError(null)
      return undefined
    }
    const key = identityKey(identity)
    let set = friendsCountSubscribers.get(key)
    if (!set) {
      set = new Set()
      friendsCountSubscribers.set(key, set)
    }
    const listener = () => setTick(t => t + 1)
    set.add(listener)
    const unsubscribe = () => {
      set.delete(listener)
      if (set.size === 0) friendsCountSubscribers.delete(key)
    }

    if (!friendsCountCache.has(key)) {
      setIsLoading(true)
      setError(null)
      let cancelled = false
      void fetchFriendsCount(identity)
        .catch(err => {
          if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
      return () => {
        cancelled = true
        unsubscribe()
      }
    }
    return unsubscribe
  }, [identity])

  const count = identity ? friendsCountCache.get(identityKey(identity)) : undefined
  return { count, isLoading, error }
}

interface UseFriendsListResult {
  friends: FriendProfile[]
  total: number | undefined
  isLoading: boolean
  error: Error | null
}

const FRIENDS_PAGE_SIZE = 200

function useFriendsList(enabled: boolean = true): UseFriendsListResult {
  const { identity } = useAuthIdentity()
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [total, setTotal] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || !identity) {
      setFriends([])
      setTotal(undefined)
      setIsLoading(false)
      setError(null)
      return undefined
    }
    let cancelled = false
    setIsLoading(true)
    setError(null)
    void (async () => {
      try {
        const c = await getClient(identity)
        // Eager-load every friend in one pass — typical user counts are well
        // below the page size; if we ever cross it, swap to incremental loads.
        const all: FriendProfile[] = []
        let offset = 0
        let totalCount: number | undefined
        while (!cancelled) {
          const response = await c.getFriends({ limit: FRIENDS_PAGE_SIZE, offset })
          if (cancelled) return
          all.push(...response.friends)
          totalCount = response.paginationData?.total ?? totalCount
          if (response.friends.length < FRIENDS_PAGE_SIZE) break
          offset += FRIENDS_PAGE_SIZE
        }
        if (cancelled) return
        setFriends(all)
        setTotal(totalCount ?? all.length)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled, identity])

  return { friends, total, isLoading, error }
}

const mutualCache = new Map<string, { count: number; friends: FriendProfile[] }>()
const mutualSubscribers = new Map<string, Set<() => void>>()

function notifyMutual(key: string) {
  mutualSubscribers.get(key)?.forEach(cb => cb())
}

const MUTUAL_PREVIEW_LIMIT = 3

async function fetchMutual(identity: AuthIdentity, address: string): Promise<{ count: number; friends: FriendProfile[] }> {
  const key = `${identityKey(identity)}|${address.toLowerCase()}`
  const c = await getClient(identity)
  const response = await c.getMutualFriends(address.toLowerCase(), { limit: MUTUAL_PREVIEW_LIMIT, offset: 0 })
  const result = {
    count: response.paginationData?.total ?? response.friends.length,
    friends: response.friends
  }
  mutualCache.set(key, result)
  notifyMutual(key)
  return result
}

interface UseMutualFriendsResult {
  count: number
  friends: FriendProfile[]
  isLoading: boolean
  error: Error | null
}

function useMutualFriends(address: string | undefined): UseMutualFriendsResult {
  const { identity } = useAuthIdentity()
  const [, setTick] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!address || !identity) {
      setIsLoading(false)
      setError(null)
      return undefined
    }
    const key = `${identityKey(identity)}|${address.toLowerCase()}`
    let set = mutualSubscribers.get(key)
    if (!set) {
      set = new Set()
      mutualSubscribers.set(key, set)
    }
    const listener = () => setTick(t => t + 1)
    set.add(listener)
    const unsubscribe = () => {
      set.delete(listener)
      if (set.size === 0) mutualSubscribers.delete(key)
    }
    if (!mutualCache.has(key)) {
      setIsLoading(true)
      setError(null)
      let cancelled = false
      void fetchMutual(identity, address)
        .catch(err => {
          if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
      return () => {
        cancelled = true
        unsubscribe()
      }
    }
    return unsubscribe
  }, [address, identity])

  const cached = address && identity ? mutualCache.get(`${identityKey(identity)}|${address.toLowerCase()}`) : undefined
  return { count: cached?.count ?? 0, friends: cached?.friends ?? [], isLoading, error }
}

interface UseUpsertFriendshipResult {
  upsert: (args: { address: string; action: FriendshipAction }) => Promise<void>
  isLoading: boolean
  error: Error | null
}

function useUpsertFriendship(): UseUpsertFriendshipResult {
  const { identity } = useAuthIdentity()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const upsert = useCallback(
    async ({ address, action }: { address: string; action: FriendshipAction }) => {
      if (!identity) throw new Error('Authentication required')
      setIsLoading(true)
      setError(null)
      try {
        await applyAction(identity, address, action)
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err))
        setError(wrapped)
        throw wrapped
      } finally {
        setIsLoading(false)
      }
    },
    [identity]
  )

  return { upsert, isLoading, error }
}

export { useFriendsCount, useFriendsList, useFriendshipStatus, useMutualFriends, useUpsertFriendship }
export type {
  FriendProfile,
  FriendshipAction,
  FriendshipStatus,
  UseFriendsCountResult,
  UseFriendsListResult,
  UseFriendshipStatusResult,
  UseMutualFriendsResult,
  UseUpsertFriendshipResult
}
