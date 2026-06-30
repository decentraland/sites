import type { AuthIdentity } from '@dcl/crypto'
import { getEnv } from '../config/env'
import { fetchWithIdentity } from '../utils/signedFetch'

// NOTE: Magic account deletion is delegated to the auth-server (DELETE /accounts), unlike thirdweb
// (which deletes client-side via the SDK). The Magic DID token travels in the signed-fetch metadata,
// so it is covered by the request signature and there is no request body.

/**
 * Requests deletion of the user's Magic account from the auth-server. The server validates the DID
 * token, cross-checks its issuer against the signed-fetch signer, and forwards the deletion to Magic.
 * The wallet itself is not deleted (the user can export the key beforehand).
 *
 * @throws If `AUTH_SERVER_URL` is unset or the request fails.
 */
async function deleteMagicAccount(identity: AuthIdentity, didToken: string, signal?: AbortSignal): Promise<void> {
  const authServerUrl = getEnv('AUTH_SERVER_URL')
  if (!authServerUrl) throw new Error('AUTH_SERVER_URL environment variable is not set')

  const response = await fetchWithIdentity(`${authServerUrl}/accounts`, identity, 'DELETE', undefined, undefined, signal, { didToken })

  if (!response.ok) {
    let message = `Account deletion failed with status ${response.status}`
    try {
      const data = await response.json()
      message = data?.message || data?.error || message
    } catch {
      // Ignore body parse errors; fall back to the status message.
    }
    throw new Error(message)
  }
}

export { deleteMagicAccount }
