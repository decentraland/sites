import { getEnv } from '../config/env'

// NOTE: magic-sdk is imported lazily (it lives in the heavy Web3 stack, see BlockchainShell) so it
// stays off the critical path — only the Delete Account flow (Magic detection + token minting)
// pulls it in.

async function createMagicInstance() {
  const apiKey = getEnv('MAGIC_API_KEY')
  if (!apiKey) throw new Error('MAGIC_API_KEY environment variable is not set')

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { Magic } = await import('magic-sdk')
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { OAuthExtension } = await import('@magic-ext/oauth2')
  return new Magic(apiKey, { extensions: [new OAuthExtension()] })
}

type MagicInstance = Awaited<ReturnType<typeof createMagicInstance>>

// Lazily-created, cached Magic instance (and its iframe). Detection and token-minting can both run —
// from different components mounting at once (e.g. the sidebar and the Delete page) — so we memoize a
// single instance to avoid bootstrapping the SDK / its iframe more than once. The instance is keyed
// by `MAGIC_API_KEY` (the same publishable key the login used, so it shares the existing session);
// that key is per-env config and is public, not a secret. A failed bootstrap is not cached, so a
// later call can retry.
let magicInstancePromise: Promise<MagicInstance> | null = null

function loadMagicInstance(): Promise<MagicInstance> {
  if (!magicInstancePromise) {
    magicInstancePromise = createMagicInstance().catch(error => {
      magicInstancePromise = null
      throw error
    })
  }
  return magicInstancePromise
}

/**
 * Whether there is an active Magic session for the configured app. This is the authoritative,
 * login-method-agnostic Magic signal: unlike the `dcl_magic_user_email` localStorage key it is set
 * for *every* Magic login (email, SMS, passkey, OAuth without email).
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
