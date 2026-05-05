import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { AuthIdentity } from '@dcl/crypto'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'
import { signedFetchFactory } from 'decentraland-crypto-fetch'
import { getEnv } from '../config/env'

// Lazy getter — throws only when a query actually runs, not at import time.
// A module-level throw would crash DappsShell at import even when no community query is made.
const getSocialApiUrl = (): string => {
  const url = getEnv('SOCIAL_API_URL')
  if (!url) throw new Error('SOCIAL_API_URL environment variable is not set')
  return url
}

const signedFetch = signedFetchFactory()

// Mirrors the SSO scan in `src/hooks/useWalletAddress.ts` (`getStoredAddress`):
// both walk every `single-sign-on-0x*` key and pick the most recent expiration.
// Kept duplicated for now because `useWalletAddress` exposes only the address (it
// runs as a hook with module-level side effects on init), and this base query
// needs the full identity object. A future refactor can lift both into a shared
// util — touching `useWalletAddress` is out of scope for this PR.
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
      const identity = getStoredIdentity()
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
