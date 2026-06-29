import type { AuthIdentity } from '@dcl/crypto'

// `decentraland-crypto-fetch` and its peer `eth-connect` total ~340 KB. These
// helpers only run on whats-on mutations (form submit, attendee toggle) and on
// authenticated reads, never on initial render. Defer the import so the
// vendor-crypto chunk stays out of the critical path on `/whats-on` and `/`.
type SignedFetch = ReturnType<typeof import('decentraland-crypto-fetch').signedFetchFactory>

let signedFetchInstance: SignedFetch | undefined
let signedFetchLoader: Promise<SignedFetch> | undefined

function getSignedFetch(): Promise<SignedFetch> {
  if (signedFetchInstance) return Promise.resolve(signedFetchInstance)
  if (!signedFetchLoader) {
    // Clear the cached loader on rejection so a transient chunk-load failure
    // doesn't permanently break the next request.
    signedFetchLoader = import('decentraland-crypto-fetch')
      .then(({ signedFetchFactory }) => {
        signedFetchInstance = signedFetchFactory()
        return signedFetchInstance
      })
      .catch(err => {
        signedFetchLoader = undefined
        throw err
      })
  }
  return signedFetchLoader
}

async function fetchWithIdentity(
  url: string,
  identity: AuthIdentity,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: BodyInit,
  headers?: Record<string, string>,
  signal?: AbortSignal,
  // Folded into the request signature (method:path:timestamp:metadata) and sent as the
  // `x-identity-metadata` header — used to carry the Magic DID token for account deletion.
  metadata?: Record<string, unknown>
): Promise<Response> {
  const signedFetch = await getSignedFetch()
  return signedFetch(url, { method, identity, body, headers, signal, metadata })
}

// `signal` is required (not optional) so callers cannot forget to thread it
// through. Pass `undefined` explicitly if cancellation isn't applicable.
async function fetchWithOptionalIdentity(
  url: string,
  identity: AuthIdentity | undefined,
  signal: AbortSignal | undefined
): Promise<Response> {
  if (!identity) return fetch(url, { signal })
  const signedFetch = await getSignedFetch()
  return signedFetch(url, { method: 'GET', identity, signal })
}

export { fetchWithIdentity, fetchWithOptionalIdentity }
