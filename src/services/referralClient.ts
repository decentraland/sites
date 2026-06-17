import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { signedFetchFactory } from 'decentraland-crypto-fetch'
import { getEnv } from '../config/env'
import { resolveActiveIdentity } from '../utils/activeIdentity'

const getReferralApiUrl = (): string => {
  const url = getEnv('REFERRAL_API_URL')
  if (!url) throw new Error('REFERRAL_API_URL environment variable is not set')
  return url
}

const signedFetch = signedFetchFactory()

const referralBaseQuery: BaseQueryFn<string | (FetchArgs & { baseUrl?: string }), unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  try {
    const fetchArgs = typeof args === 'string' ? { url: args } : args
    const customBaseUrl = (fetchArgs as { baseUrl?: string }).baseUrl
    const baseUrl = customBaseUrl ?? getReferralApiUrl()

    const fetchFn: typeof fetch = async (input, init) => {
      // Resolve through the same pointer/snapshot chain `useWalletAddress` uses —
      // a raw max-expiration scan over `single-sign-on-0x…` keys can pick a STALE
      // wallet from a previous session and sign referral calls as the wrong user.
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

const referralClient = createApi({
  reducerPath: 'referralClient',
  baseQuery: referralBaseQuery,
  tagTypes: ['ReferralState'],
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: true,
  endpoints: () => ({})
})

export { referralClient }
