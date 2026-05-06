import type { AuthIdentity } from '@dcl/crypto'
import { signedFetchFactory } from 'decentraland-crypto-fetch'

const signedFetch = signedFetchFactory()

function fetchWithIdentity(
  url: string,
  identity: AuthIdentity,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: BodyInit,
  headers?: Record<string, string>,
  signal?: AbortSignal
): Promise<Response> {
  return signedFetch(url, { method, identity, body, headers, signal })
}

function fetchWithOptionalIdentity(url: string, identity: AuthIdentity | undefined): Promise<Response> {
  if (identity) {
    return signedFetch(url, { method: 'GET', identity })
  }
  return fetch(url)
}

export { fetchWithIdentity, fetchWithOptionalIdentity }
