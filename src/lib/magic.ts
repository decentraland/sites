import { getEnv } from '../config/env'

// NOTE: magic-sdk is imported lazily (it lives in the heavy Web3 stack, see BlockchainShell) so it
// stays off the critical path — only the Delete Account flow (Magic detection + token minting)
// pulls it in.

/**
 * Builds a Magic instance keyed by `MAGIC_API_KEY` (the same publishable key the login used, so it
 * shares the existing Magic session). `MAGIC_API_KEY` is per-env config and is public, not a secret.
 *
 * @throws If `MAGIC_API_KEY` is unset.
 */
async function loadMagicInstance() {
  const apiKey = getEnv('MAGIC_API_KEY')
  if (!apiKey) throw new Error('MAGIC_API_KEY environment variable is not set')

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { Magic } = await import('magic-sdk')
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { OAuthExtension } = await import('@magic-ext/oauth2')
  return new Magic(apiKey, { extensions: [new OAuthExtension()] })
}

/**
 * Whether there is an active Magic session for the configured app. This is the authoritative,
 * login-method-agnostic Magic signal: unlike the `dcl_magic_user_email` localStorage key it is set
 * for *every* Magic login (email, SMS, passkey, OAuth without email). The connector id (`'magic'`)
 * would be authoritative too, but wagmi only persists it after a BlockchainShell wallet action, so
 * it is not reliably present in the provider-free account section.
 *
 * Resolves `false` (never throws) when the SDK is unavailable or `MAGIC_API_KEY` is unset, so
 * callers can safely treat it as "not Magic".
 */
async function isMagicLoggedIn(): Promise<boolean> {
  try {
    const magic = await loadMagicInstance()
    return await magic.user.isLoggedIn()
  } catch {
    return false
  }
}

/**
 * Mints a fresh Magic DID token for the currently logged-in user. It is sent to the auth-server in
 * the signed-fetch metadata of `DELETE /accounts`, where it is validated (signature, freshness,
 * audience) and its issuer is cross-checked against the signed-fetch signer before deletion.
 *
 * @throws If `MAGIC_API_KEY` is unset or the user has no active Magic session.
 */
async function getMagicDidToken(): Promise<string> {
  const magic = await loadMagicInstance()

  if (!(await magic.user.isLoggedIn())) {
    throw new Error('Magic: user is not logged in')
  }
  return magic.user.getIdToken()
}

export { getMagicDidToken, isMagicLoggedIn }
