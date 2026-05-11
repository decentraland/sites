// @dcl/crypto is CJS; named ESM imports from the package root only resolve the
// ones that index.js re-exports (Authenticator + validators). The crypto helpers
// (createUnsafeIdentity, computeAddress, ethSign) live in a sibling module that
// other DCL packages import via subpath — see decentraland-crypto-fetch's use
// of `@dcl/crypto/dist/Authenticator` for precedent. We mirror that pattern.
import crypto from '@dcl/crypto'
import cryptoHelpers from '@dcl/crypto/dist/crypto.js'
import { Buffer } from 'node:buffer'

const { Authenticator } = crypto
const { createUnsafeIdentity, ethSign, recoverAddressFromEthSignature } = cryptoHelpers

// 1 day. The identity only lives in the headless browser for the duration of
// the run; we don't persist it anywhere, so a short lifespan is fine.
const LIFESPAN_MINUTES = 60 * 24

const PK_REGEX = /^0x[0-9a-fA-F]{64}$/

function privateKeyBytes(pk) {
  return Buffer.from(pk.slice(2), 'hex')
}

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
 *
 * createUnsafeIdentity() uses @noble/secp256k1's CSPRNG under the hood despite
 * the historical "unsafe" label in its docstring; the resulting ephemeral key
 * never leaves this process anyway.
 */
export async function buildIdentityFromEnv() {
  const raw = process.env.DCL_TEST_PRIVATE_KEY
  if (!raw) return null

  const pk = raw.trim()
  if (!PK_REGEX.test(pk)) {
    throw new Error('DCL_TEST_PRIVATE_KEY must be a 0x-prefixed 64-hex-char private key')
  }

  const ownerPkBytes = privateKeyBytes(pk)
  // @dcl/crypto doesn't expose secp256k1 directly (would require pulling
  // @noble/curves as a direct dep). Instead we sign a fixed throwaway probe
  // and recover the address from the signature — round-trip uses only the
  // helpers @dcl/crypto already publishes.
  const probeMessage = 'sites-screenshots:derive-owner-address'
  const probeSignature = ethSign(ownerPkBytes, probeMessage)
  const ownerAddress = recoverAddressFromEthSignature(probeSignature, probeMessage)
  const ephemeral = createUnsafeIdentity()

  const identity = await Authenticator.initializeAuthChain(
    ownerAddress,
    ephemeral,
    LIFESPAN_MINUTES,
    async message => ethSign(ownerPkBytes, message)
  )

  return {
    address: ownerAddress.toLowerCase(),
    identityJson: JSON.stringify(identity)
  }
}
