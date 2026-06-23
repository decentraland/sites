import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../config/env'

// Lazy getter — throws only when a query actually runs (rule 16: no module-top-level throws
// in shell-reachable code).
const getMarketplaceApiUrl = (): string => {
  const url = getEnv('MARKETPLACE_API_URL')
  if (!url) throw new Error('MARKETPLACE_API_URL environment variable is not set')
  return url
}

const marketplaceBaseQuery: BaseQueryFn<string | (FetchArgs & { baseUrl?: string }), unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  try {
    const fetchArgs = typeof args === 'string' ? { url: args } : args
    const customBaseUrl = (fetchArgs as { baseUrl?: string }).baseUrl
    const baseUrl = customBaseUrl ?? getMarketplaceApiUrl()
    return await fetchBaseQuery({
      baseUrl,
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

const marketplaceClient = createApi({
  reducerPath: 'marketplaceClient',
  baseQuery: marketplaceBaseQuery,
  tagTypes: ['Items', 'Nfts'],
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 60,
  endpoints: () => ({})
})

export { marketplaceClient }
