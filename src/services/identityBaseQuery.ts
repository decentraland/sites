import type { BaseQueryFn, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { signedFetchFactory } from 'decentraland-crypto-fetch'
import { getEnv } from '../config/env'
import { resolveActiveIdentity } from '../utils/activeIdentity'
import { getAuthSession } from '../utils/authSession'
import { identityAddress } from '../utils/identityScope'
import type { IdentityFetchArgs } from './identityBaseQuery.types'

const createIdentityBaseQuery = (
  envKey: string,
  requireIdentity = false
): BaseQueryFn<string | IdentityFetchArgs, unknown, FetchBaseQueryError> => {
  const signedFetch = signedFetchFactory()
  return async (args, api, extraOptions) => {
    const { account, baseUrl: customBaseUrl, ...fetchArgs } = typeof args === 'string' ? { url: args } : args
    const session = getAuthSession()
    const expectedAccount = account?.toLowerCase()
    const identity = expectedAccount ? resolveActiveIdentity() : undefined
    const unauthorized = { error: { status: 401, data: 'Session changed. Please sign in again.' } } as const
    const matchesSession = () => {
      const activeIdentity = resolveActiveIdentity()
      return (
        session === getAuthSession() &&
        identityAddress(activeIdentity) === expectedAccount &&
        activeIdentity?.authChain?.[1]?.payload === identity?.authChain?.[1]?.payload
      )
    }
    // Public calls are explicitly unsigned. A cached public response must never depend on a
    // hidden localStorage identity, and private calls must not sign as a different account.
    if ((requireIdentity && !expectedAccount) || (expectedAccount && (!identity || !matchesSession()))) return unauthorized
    try {
      const baseUrl = customBaseUrl ?? getEnv(envKey)
      if (!baseUrl) throw new Error(`${envKey} environment variable is not set`)
      const fetchFn: typeof fetch = (input, init) =>
        identity ? signedFetch(input as RequestInfo, { ...init, identity }) : fetch(input, init)
      const result = await fetchBaseQuery({
        baseUrl,
        fetchFn,
        prepareHeaders: headers => {
          headers.set('Content-Type', 'application/json')
          return headers
        }
      })(fetchArgs, api, extraOptions)
      // A late response from a previous account/session is not usable data, even if successful.
      return expectedAccount && !matchesSession() ? unauthorized : result
    } catch (error) {
      return { error: { status: 'FETCH_ERROR', error: error instanceof Error ? error.message : 'Network request failed' } }
    }
  }
}

export { createIdentityBaseQuery }
