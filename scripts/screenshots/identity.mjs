import { Authenticator } from '@dcl/crypto'
import { Wallet } from 'ethers'

// 1 day. The identity only lives in the headless browser for the duration of the
// run; we don't persist it anywhere, so a short lifespan is fine.
const LIFESPAN_MINUTES = 60 * 24

const PK_REGEX = /^0x[0-9a-fA-F]{64}$/

/**
 * Reads DCL_TEST_PRIVATE_KEY from env and produces an AuthIdentity ready to be
 * dropped into localStorage under `single-sign-on-<lowercase-address>`.
 *
 * Returns null when the secret is unset — the caller falls back to anonymous
 * captures, so PRs from forks (no secret access) and ad-hoc local runs without
 * a wallet keep working.
 *
 * Throws when the secret is set but malformed — silent fallback would let a
 * misconfigured run pretend it's signed-in while capturing the anon UI.
 */
export async function buildIdentityFromEnv() {
  const raw = process.env.DCL_TEST_PRIVATE_KEY
  if (!raw) return null

  const pk = raw.trim()
  if (!PK_REGEX.test(pk)) {
    throw new Error('DCL_TEST_PRIVATE_KEY must be a 0x-prefixed 64-hex-char private key')
  }

  const owner = new Wallet(pk)
  const ephemeral = Wallet.createRandom()

  const identity = await Authenticator.initializeAuthChain(
    owner.address,
    {
      address: ephemeral.address,
      publicKey: ephemeral.signingKey.publicKey,
      privateKey: ephemeral.privateKey
    },
    LIFESPAN_MINUTES,
    async message => owner.signMessage(message)
  )

  return {
    address: owner.address.toLowerCase(),
    identityJson: JSON.stringify(identity)
  }
}
