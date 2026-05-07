import { cmsBaseUrl } from '../../../services/blogClient'
import type { SlugFields } from './blog.types'
import type { CMSEntry, CMSQueryParams, CMSReference } from './cms.types'

// ============================================================================
// SLUG EXTRACTION - Unified logic for getting slug from CMS entries
// ============================================================================

/**
 * Extracts slug from CMS entry fields.
 */
const getEntrySlug = (fields: SlugFields, sysId?: string): string => {
  return fields.id || sysId || ''
}

// Helper function to fetch from CMS API
const fetchFromCMS = async (endpoint: string, params?: CMSQueryParams): Promise<unknown> => {
  const baseUrl = cmsBaseUrl
  const url = new URL(`${baseUrl}${endpoint}`, window.location.origin)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`CMS API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// ============================================================================
// ENTRY CACHES - For assets, categories, authors, and resolved posts
// Prevents duplicate requests when resolving references
// TODO: These module-level Maps are unbounded. If the blog grows to thousands of entries,
// replace with a capped LRU cache (e.g. lru-cache or a tiny custom implementation).
// ============================================================================

const assetsCache = new Map<string, CMSEntry>()
const assetsCachePromises = new Map<string, Promise<CMSEntry>>()

const entriesCache = new Map<string, CMSEntry>()
const entriesCachePromises = new Map<string, Promise<CMSEntry>>()

const resolveAssetLink = async (value: unknown): Promise<unknown> => {
  const link = value as CMSReference
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Asset') {
    const assetId = link.sys.id

    // Return from cache if available
    if (assetsCache.has(assetId)) {
      return assetsCache.get(assetId)
    }

    // If already fetching, wait for that promise
    if (assetsCachePromises.has(assetId)) {
      return assetsCachePromises.get(assetId)
    }

    // Start fetching
    const assetPromise = fetchFromCMS(`/assets/${assetId}`)
      .then(asset => {
        const cmsAsset = asset as CMSEntry
        assetsCache.set(assetId, cmsAsset)
        assetsCachePromises.delete(assetId)
        return cmsAsset
      })
      .catch(() => {
        assetsCachePromises.delete(assetId)
        return value as CMSEntry
      })

    assetsCachePromises.set(assetId, assetPromise)
    return assetPromise
  }

  return value
}

// ============================================================================
// CATEGORY RESOLVER - Uses module-level caches for resolved entries
// ============================================================================

// NOTE: initializeHelpers/storeRef were removed — the RTK cache-lookup shortcut was dead
// code (initializeHelpers was never called, storeRef was always null). Entry resolution
// falls through to fetchAndCacheEntry which has its own module-level dedup Map.

// Local cache for resolved categories/authors with their images
const resolvedCategoriesCache = new Map<string, CMSEntry>()
const resolvedAuthorsCache = new Map<string, CMSEntry>()

// TODO: Optimize — replace per-post reference resolution with Contentful `include` param
// on the original query (resolves references server-side). Current implementation fires
// 3 parallel requests per post; first load of 7 posts = 21+ requests.

// Helper to fetch and cache an entry by ID
const fetchAndCacheEntry = async (entryId: string): Promise<CMSEntry> => {
  // Return from cache if available
  if (entriesCache.has(entryId)) {
    return entriesCache.get(entryId)!
  }

  // If already fetching, wait for that promise
  if (entriesCachePromises.has(entryId)) {
    return entriesCachePromises.get(entryId)!
  }

  // Start fetching
  const entryPromise = fetchFromCMS(`/entries/${entryId}`)
    .then(async fetched => {
      const cmsEntry = fetched as CMSEntry
      if (cmsEntry.fields?.image) {
        cmsEntry.fields.image = await resolveAssetLink(cmsEntry.fields.image)
      }
      entriesCache.set(entryId, cmsEntry)
      entriesCachePromises.delete(entryId)
      return cmsEntry
    })
    .catch(() => {
      entriesCachePromises.delete(entryId)
      throw new Error(`Failed to fetch entry ${entryId}`)
    })

  entriesCachePromises.set(entryId, entryPromise)
  return entryPromise
}

const resolveCategoryLink = async (value: unknown): Promise<unknown> => {
  const link = value as CMSReference
  const entry = value as CMSEntry

  // If it's a Link reference, resolve via module-level entry cache
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Entry') {
    const entryId = link.sys.id

    // Check resolved cache first (already has image resolved)
    if (resolvedCategoriesCache.has(entryId)) {
      return resolvedCategoriesCache.get(entryId)!
    }

    try {
      const fetched = await fetchAndCacheEntry(entryId)
      resolvedCategoriesCache.set(entryId, fetched)
      return fetched
    } catch {
      return value
    }
  }

  // If it already has fields, it's already resolved
  if (entry?.sys?.id && entry?.fields) {
    if (resolvedCategoriesCache.has(entry.sys.id)) {
      return resolvedCategoriesCache.get(entry.sys.id)!
    }
    if (entry.fields.image) {
      entry.fields.image = await resolveAssetLink(entry.fields.image)
    }
    resolvedCategoriesCache.set(entry.sys.id, entry)
    return entry
  }

  return value
}

// ============================================================================
// AUTHOR RESOLVER - Uses module-level caches
// ============================================================================

const resolveAuthorLink = async (value: unknown): Promise<unknown> => {
  const link = value as CMSReference
  const entry = value as CMSEntry

  // If it's a Link reference, resolve via module-level entry cache
  if (link?.sys?.type === 'Link' && link.sys.linkType === 'Entry') {
    const entryId = link.sys.id

    if (resolvedAuthorsCache.has(entryId)) {
      return resolvedAuthorsCache.get(entryId)!
    }

    try {
      const fetched = await fetchAndCacheEntry(entryId)
      resolvedAuthorsCache.set(entryId, fetched)
      return fetched
    } catch {
      return value
    }
  }

  // If it already has fields, just resolve the image if needed
  if (entry?.sys?.id && entry?.fields) {
    if (resolvedAuthorsCache.has(entry.sys.id)) {
      return resolvedAuthorsCache.get(entry.sys.id)!
    }
    if (entry.fields.image) {
      entry.fields.image = await resolveAssetLink(entry.fields.image)
    }
    resolvedAuthorsCache.set(entry.sys.id, entry)
    return entry
  }

  return value
}

// ============================================================================
// URL RESOLVERS - Simple functions that return just URLs/slugs from references
// ============================================================================

const resolveAssetUrl = async (assetId: string): Promise<string> => {
  if (!assetId) return ''

  const resolved = await resolveAssetLink({ sys: { type: 'Link', linkType: 'Asset', id: assetId } })
  const asset = resolved as CMSEntry
  const url = (asset?.fields?.file as { url?: string })?.url || ''
  return url.startsWith('//') ? `https:${url}` : url
}

const resolveEntrySlug = async (entryId: string): Promise<string> => {
  if (!entryId) return ''

  // Return from cache if available
  if (entriesCache.has(entryId)) {
    const entry = entriesCache.get(entryId)
    return entry?.fields?.id as string
  }

  // If already fetching, wait for that promise
  if (entriesCachePromises.has(entryId)) {
    const entry = await entriesCachePromises.get(entryId)
    return entry?.fields?.id as string
  }

  try {
    const entryPromise = fetchFromCMS(`/entries/${entryId}`)
    entriesCachePromises.set(entryId, entryPromise as Promise<CMSEntry>)

    const entry = (await entryPromise) as CMSEntry
    entriesCache.set(entryId, entry)
    entriesCachePromises.delete(entryId)

    return entry?.fields?.id as string
  } catch {
    entriesCachePromises.delete(entryId)
    return ''
  }
}

export { fetchFromCMS, getEntrySlug, resolveAssetLink, resolveAssetUrl, resolveAuthorLink, resolveCategoryLink, resolveEntrySlug }
