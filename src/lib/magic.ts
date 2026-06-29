import { getEnv } from '../config/env'

// NOTE: magic-sdk is imported lazily (it lives in the heavy Web3 stack, see BlockchainShell) so it
// stays off the critical path — only the Delete Account flow for Magic users pulls it in.

/**
 * Mints a fresh Magic DID token for the currently logged-in user. It is sent to the auth-server in
 * the signed-fetch metadata of `DELETE /accounts`, where it is validated (signature, freshness,
 * audience) and its issuer is cross-checked against the signed-fetch signer before deletion.
 *
 * The Magic instance is keyed by `MAGIC_API_KEY` (the same publishable key the login used), so it
 * shares the existing session. `MAGIC_API_KEY` is per-env config and is public, not a secret.
 *
 * @throws If `MAGIC_API_KEY` is unset or the user has no active Magic session.
 */
async function getMagicDidToken(): Promise<string> {
  const apiKey = getEnv('MAGIC_API_KEY')
  if (!apiKey) throw new Error('MAGIC_API_KEY environment variable is not set')

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { Magic } = await import('magic-sdk')
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { OAuthExtension } = await import('@magic-ext/oauth2')
  const magic = new Magic(apiKey, { extensions: [new OAuthExtension()] })

  if (!(await magic.user.isLoggedIn())) {
    throw new Error('Magic: user is not logged in')
  }
  return magic.user.getIdToken()
}

export { getMagicDidToken }
