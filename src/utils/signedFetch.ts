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

// `signal` is required (not optional) so callers cannot forget to thread it
// through. Pass `undefined` explicitly if cancellation isn't applicable.
function fetchWithOptionalIdentity(url: string, identity: AuthIdentity | undefined, signal: AbortSignal | undefined): Promise<Response> {
  if (identity) {
    return signedFetch(url, { method: 'GET', identity, signal })
  }
  return fetch(url, { signal })
}

export { fetchWithIdentity, fetchWithOptionalIdentity }
