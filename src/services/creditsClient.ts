import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { signedFetchFactory } from 'decentraland-crypto-fetch'
import { getEnv } from '../config/env'
import { resolveActiveIdentity } from '../utils/activeIdentity'

// Lazy getter — never throw at module top level. This file is imported by
// `src/shells/store.ts`, and a top-level throw would crash the whole lazy
// DappsShell chunk load (Pre-PR rule 16).
const getCreditsServerUrl = (): string => {
  const url = getEnv('CREDITS_SERVER_URL')
  if (!url) throw new Error('CREDITS_SERVER_URL environment variable is not set')
  return url
}

const signedFetch = signedFetchFactory()

const creditsBaseQuery: BaseQueryFn<string | (FetchArgs & { baseUrl?: string }), unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  try {
    const fetchArgs = typeof args === 'string' ? { url: args } : args
    const customBaseUrl = (fetchArgs as { baseUrl?: string }).baseUrl
    const baseUrl = customBaseUrl ?? getCreditsServerUrl()

    const fetchFn: typeof fetch = async (input, init) => {
      // Resolve through the same pointer/snapshot chain `useWalletAddress` uses —
      // a raw max-expiration scan over `single-sign-on-0x…` keys can pick a STALE
      // wallet from a previous session and sign credits calls as the wrong user.
      const identity = resolveActiveIdentity()
      if (identity) {
        return signedFetch(input as RequestInfo, { ...(init ?? {}), identity })
      }
      return fetch(input, init)
    }

    return await fetchBaseQuery({
      baseUrl,
      fetchFn,
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

const creditsClient = createApi({
  reducerPath: 'creditsClient',
  baseQuery: creditsBaseQuery,
  tagTypes: ['CreditsStatus'],
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: () => ({})
})

export { creditsClient }
