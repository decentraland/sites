import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { AuthIdentity } from '@dcl/crypto'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'
import { signedFetchFactory } from 'decentraland-crypto-fetch'
import { getEnv } from '../config/env'

const getReferralApiUrl = (): string => {
  const url = getEnv('REFERRAL_API_URL')
  if (!url) throw new Error('REFERRAL_API_URL environment variable is not set')
  return url
}

const signedFetch = signedFetchFactory()

function getStoredIdentity(): AuthIdentity | undefined {
  try {
    let bestIdentity: AuthIdentity | undefined
    let bestExpiration = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('single-sign-on-0x')) continue
      const address = key.replace('single-sign-on-', '')
      const identity = localStorageGetIdentity(address.toLowerCase())
      if (!identity) continue
      const payload = identity.authChain?.[1]?.payload
      const match = payload ? String(payload).match(/Expiration: ([^\n]+)/) : null
      const expiration = match ? new Date(match[1]).getTime() : 0
      if (expiration > bestExpiration) {
        bestExpiration = expiration
        bestIdentity = identity
      }
    }
    return bestIdentity
  } catch {
    return undefined
  }
}

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
      const identity = getStoredIdentity()
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
