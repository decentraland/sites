import { createApi, fakeBaseQuery, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
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
 * CMS Client - For blog posts, categories, and authors from Contentful
 * Uses fetchBaseQuery with Vite proxy in development to avoid CORS
 */
const cmsClient = createApi({
  reducerPath: 'cmsClient',
  // baseUrl is resolved lazily per-request so the module can be imported without CMS_BASE_URL set
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  tagTypes: ['BlogPosts', 'BlogPost', 'Categories', 'Authors'],
  keepUnusedDataFor: 300, // Cache for 5 minutes
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({})
})

/**
 * Algolia Client - For search functionality
 * Uses fakeBaseQuery since we use Algolia SDK directly
 */
const algoliaClient = createApi({
  reducerPath: 'algoliaClient',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['SearchResults'],
  keepUnusedDataFor: 300, // Cache for 5 minutes
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({})
})

export { algoliaClient, cmsBaseUrl, cmsClient, getCmsBaseUrl }
