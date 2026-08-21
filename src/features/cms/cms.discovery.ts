import { useSyncExternalStore } from 'react'
import { getEnv } from '../../config/env'
import { buildLatestPosts } from './cms.discovery.helpers'
import type { CMSAssetResponse, CMSCategoriesResponse, CMSPostsResponse, LatestPost } from './cms.discovery.types'

const POSTS_LIMIT = 3
const FETCH_TIMEOUT_MS = 10_000

// Plain-fetch client for the lightweight tier (no Redux, no RTK Query): /create
// renders in the main bundle, so it must not import services/cmsClient.
// cms-api allows cross-origin reads, which keeps this proxy-free in dev too.

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T | null> {
  try {
    const response = await fetch(url, { signal })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

async function fetchLatestPosts(): Promise<LatestPost[]> {
  const baseUrl = getEnv('CMS_BASE_URL')
  if (!baseUrl) return []

  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  const [posts, categories] = await Promise.all([
    fetchJson<CMSPostsResponse>(`${baseUrl}/blog/posts?limit=${POSTS_LIMIT}`, signal),
    fetchJson<CMSCategoriesResponse>(`${baseUrl}/blog/categories`, signal)
  ])
  if (!posts || posts.items.length === 0) return []

  const assetIds = posts.items.map(post => post.fields?.image?.sys.id).filter((id): id is string => Boolean(id))
  const assets = await Promise.all(assetIds.map(id => fetchJson<CMSAssetResponse>(`${baseUrl}/assets/${id}`, signal)))
  const assetUrlById = new Map<string, string>()
  assetIds.forEach((id, index) => {
    const fileUrl = assets[index]?.fields?.file?.url
    if (fileUrl) assetUrlById.set(id, fileUrl)
  })

  return buildLatestPosts(posts.items, categories, assetUrlById)
}

type LatestPostsSnapshot = { data: LatestPost[]; isLoading: boolean }

let snapshot: LatestPostsSnapshot = { data: [], isLoading: true }
const listeners = new Set<() => void>()
let subscribers = 0
let activeFetch: Promise<void> | null = null

function commit(data: LatestPost[]) {
  snapshot = { data, isLoading: false }
  listeners.forEach(listener => listener())
}

function runFetch(): Promise<void> {
  if (activeFetch) return activeFetch
  const promise = fetchLatestPosts()
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
  // Blog cadence is editorial, not real-time: refetch when the section regains
  // its first consumer (stale-while-revalidate) instead of polling.
  if (subscribers === 1) void runFetch()
  return () => unsubscribe(listener)
}

function unsubscribe(listener: () => void): void {
  if (!listeners.has(listener)) return
  listeners.delete(listener)
  subscribers -= 1
}

function getSnapshot(): LatestPostsSnapshot {
  return snapshot
}

function useGetLatestBlogPostsQuery(): LatestPostsSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export { useGetLatestBlogPostsQuery }
