import { getEnv } from '../../config/env'
import type { CMSQueryParams, ContentfulEntry, ContentfulLink } from './contentful.types'

const spaceId = getEnv('CONTENTFUL_SPACE_ID') || 'ea2ybdmmn1kv'
const environment = getEnv('CONTENTFUL_ENVIRONMENT') || 'master'

const CMS_BASE_URL = import.meta.env.DEV
  ? `/api/cms/spaces/${spaceId}/environments/${environment}`
  : `https://cms.decentraland.org/spaces/${spaceId}/environments/${environment}`

const entryCache = new Map<string, Promise<unknown>>()
const assetCache = new Map<string, Promise<unknown>>()

const clearContentfulCache = (): void => {
  entryCache.clear()
  assetCache.clear()
}

const FETCH_TIMEOUT = 10000
const MAX_CONCURRENT = 6

let activeRequests = 0
const requestQueue: Array<{
  execute: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
}> = []

const processQueue = (): void => {
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const next = requestQueue.shift()
    if (next) {
      activeRequests++
      next
        .execute()
        .then(next.resolve)
        .catch(next.reject)
        .finally(() => {
          activeRequests--
          processQueue()
        })
    }
  }
}

const enqueueRequest = (execute: () => Promise<unknown>): Promise<unknown> => {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++
    return execute().finally(() => {
      activeRequests--
      processQueue()
    })
  }

  return new Promise((resolve, reject) => {
    requestQueue.push({ execute, resolve, reject })
  })
}

const fetchWithTimeout = (url: string, timeout: number): Promise<Response> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId))
}

const fetchFromCMS = async (endpoint: string, params?: CMSQueryParams): Promise<unknown> => {
  const baseUrl = CMS_BASE_URL.startsWith('/') ? `${window.location.origin}${CMS_BASE_URL}` : CMS_BASE_URL
  const url = new URL(`${baseUrl}${endpoint}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  return enqueueRequest(async () => {
    const response = await fetchWithTimeout(url.toString(), FETCH_TIMEOUT)

    if (!response.ok) {
      throw new Error(`CMS API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  })
}

const fetchEntry = async (id: string) => fetchFromCMS(`/entries/${id}`)

const resolveLinksInFields = async (entry: unknown): Promise<ContentfulEntry> => {
  const contentfulEntry = entry as ContentfulEntry
  if (!contentfulEntry || !contentfulEntry.fields) {
    return contentfulEntry
  }

  const resolved: ContentfulEntry = { ...contentfulEntry }
  resolved.fields = { ...contentfulEntry.fields }

  const fieldPromises = Object.entries(contentfulEntry.fields).map(async ([key, value]) => {
    let resolvedValue: unknown
    if (Array.isArray(value)) {
      resolvedValue = await Promise.all(value.map(item => resolveLink(item)))
    } else {
      resolvedValue = await resolveLink(value)
    }
    return [key, resolvedValue]
  })

  const resolvedFields = await Promise.all(fieldPromises)
  resolved.fields = Object.fromEntries(resolvedFields)

  return resolved
}

const resolveLink = async (link: unknown): Promise<unknown> => {
  const contentfulLink = link as ContentfulLink
  if (!contentfulLink?.sys?.type || contentfulLink.sys.type !== 'Link') {
    return link
  }

  try {
    let resolved: unknown
    if (contentfulLink.sys.linkType === 'Asset') {
      const cacheKey = contentfulLink.sys.id
      if (!assetCache.has(cacheKey)) {
        assetCache.set(cacheKey, fetchFromCMS(`/assets/${cacheKey}`))
      }
      resolved = await assetCache.get(cacheKey)!
    } else if (contentfulLink.sys.linkType === 'Entry') {
      const cacheKey = contentfulLink.sys.id
      if (!entryCache.has(cacheKey)) {
        const entryPromise = fetchEntry(cacheKey).then(entry => resolveLinksInFields(entry))
        entryCache.set(cacheKey, entryPromise)
      }
      resolved = await entryCache.get(cacheKey)!
    } else {
      resolved = link
    }

    return resolved
  } catch (error) {
    console.warn('[CMS] Failed to resolve link:', contentfulLink.sys?.id, error)
    return link
  }
}

const resolveLinks = async (entry: unknown): Promise<ContentfulEntry> => resolveLinksInFields(entry)

export { clearContentfulCache, resolveLinks }
