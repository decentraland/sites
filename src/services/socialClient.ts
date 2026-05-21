import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { signedFetchFactory } from 'decentraland-crypto-fetch'
import { getEnv } from '../config/env'
import { resolveActiveIdentity } from '../utils/activeIdentity'

// Lazy getter — throws only when a query actually runs, not at import time.
// A module-level throw would crash DappsShell at import even when no community query is made.
const getSocialApiUrl = (): string => {
  const url = getEnv('SOCIAL_API_URL')
  if (!url) throw new Error('SOCIAL_API_URL environment variable is not set')
  return url
}

const signedFetch = signedFetchFactory()

const socialBaseQuery: BaseQueryFn<string | (FetchArgs & { baseUrl?: string }), unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  try {
    const fetchArgs = typeof args === 'string' ? { url: args } : args
    const customBaseUrl = (fetchArgs as { baseUrl?: string }).baseUrl
    const baseUrl = customBaseUrl ?? getSocialApiUrl()

    const fetchFn: typeof fetch = async (input, init) => {
      const identity = resolveActiveIdentity()
      if (identity) {
        return signedFetch(input as RequestInfo, { ...(init ?? {}), identity })
      }
      return fetch(input, init)
    }

    return await fetchBaseQuery({
      baseUrl,
      fetchFn: fetchFn,
      prepareHeaders: headers => {
        headers.set('Content-Type', 'application/json')
        return headers
      }
    })(args, api, extraOptions)
  } catch (error) {
    return {
      error: {
        status: 'FETCH_ERROR',
        error: error instanceof Error ? error.message : 'Network request failed'
      } satisfies FetchBaseQueryError
    }
  }
}

const socialClient = createApi({
  reducerPath: 'socialClient',
  baseQuery: socialBaseQuery,
  tagTypes: ['Communities', 'Events', 'Members', 'MemberRequests'],
  keepUnusedDataFor: 60,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 30,
  endpoints: () => ({})
})

export { socialClient }
