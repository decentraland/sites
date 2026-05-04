import type { AuthIdentity } from '@dcl/crypto'

// `decentraland-crypto-fetch` and its peer `eth-connect` total ~340 KB. The
// helpers below are only used on whats-on mutations (form submit, attendee
// toggle), never on the initial render. Defer the import so the vendor-crypto
// chunk stays out of the critical path on `/whats-on` and `/`.
let signedFetchPromise: ReturnType<typeof import('decentraland-crypto-fetch').signedFetchFactory> | undefined
let signedFetchLoader: Promise<ReturnType<typeof import('decentraland-crypto-fetch').signedFetchFactory>> | undefined

function getSignedFetch(): Promise<ReturnType<typeof import('decentraland-crypto-fetch').signedFetchFactory>> {
  if (signedFetchPromise) return Promise.resolve(signedFetchPromise)
  if (!signedFetchLoader) {
    // Clear the cached loader on rejection so a transient chunk-load failure
    // doesn't permanently break wallet sign-in for the rest of the session.
    signedFetchLoader = import('decentraland-crypto-fetch')
      .then(({ signedFetchFactory }) => {
        signedFetchPromise = signedFetchFactory()
        return signedFetchPromise
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
  headers?: Record<string, string>
): Promise<Response> {
  const signedFetch = await getSignedFetch()
  return signedFetch(url, { method, identity, body, headers })
}

async function fetchWithOptionalIdentity(url: string, identity: AuthIdentity | undefined): Promise<Response> {
  if (!identity) return fetch(url)
  const signedFetch = await getSignedFetch()
  return signedFetch(url, { method: 'GET', identity })
}

export { fetchWithIdentity, fetchWithOptionalIdentity }
