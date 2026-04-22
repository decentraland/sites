import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../config/env'

// Lazy getter — throws only when a query actually runs, not at import time.
// A module-level throw crashes DappsShell at import even when no blog query is made.
const getCmsBaseUrl = (): string => {
  const url = getEnv('CMS_BASE_URL')
  if (!url) throw new Error('CMS_BASE_URL environment variable is not set')
  // In development, use the Vite proxy to avoid CORS issues; in production, use the direct CMS URL
  return import.meta.env.DEV ? '/api/cms' : url
}

// Exposed for blog.helpers.ts (fetchFromCMS uses it to resolve references)
const cmsBaseUrl = import.meta.env.DEV ? '/api/cms' : getEnv('CMS_BASE_URL') ?? ''

/**
 * CMS Client — blog posts, categories, authors, and full-text search from Contentful.
 * Search endpoints inject into this same client because the cms-server search path
 * (/blog/posts?q=) shares the CMS_BASE_URL origin and HTTP cache.
 */
const cmsClient = createApi({
  reducerPath: 'cmsClient',
  // baseUrl is resolved lazily per-request so the module can be imported without CMS_BASE_URL set
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  tagTypes: ['BlogPosts', 'BlogPost', 'Categories', 'Authors', 'SearchResults'],
  keepUnusedDataFor: 300, // Cache for 5 minutes
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({})
})

export { cmsBaseUrl, cmsClient, getCmsBaseUrl }
