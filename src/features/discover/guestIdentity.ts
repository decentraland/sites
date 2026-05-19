import { Authenticator } from '@dcl/crypto'
import type { AuthIdentity } from '@dcl/crypto'
// @dcl/crypto re-exports `createUnsafeIdentity` and `ethSign` from a sibling
// subpath rather than the package root (CJS quirk). Mirror the pattern used
// in `scripts/screenshots/identity.mjs` so this stays runtime-stable.
import { createUnsafeIdentity, ethSign } from '@dcl/crypto/dist/crypto'

// 24h — long enough that the same identity survives a typical browsing session
// across multiple scene visits, short enough that a stale tab eventually rolls.
const LIFESPAN_MINUTES = 60 * 24

let cached: AuthIdentity | null = null

// Strips the leading 0x and converts to bytes — `ethSign` takes Uint8Array.
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

// Builds a throwaway DCL identity (ephemeral wallet + ephemeral session key)
// suitable for signed-fetch against comms-gatekeeper. The gatekeeper only
// validates that the auth chain is well-formed and reads metadata out of it —
// it does NOT require the signer to be a real on-chain wallet, so a fresh
// random key works for anonymous scene watching.
//
// Cached for the lifetime of the tab so consecutive scene visits reuse the
// same identity (and any rate limits / ban records would persist across
// rooms, matching how the Explorer behaves).
async function getGuestIdentity(): Promise<AuthIdentity> {
  if (cached) return cached

  const ownerKey = createUnsafeIdentity()
  const sessionKey = createUnsafeIdentity()
  const ownerPkBytes = hexToBytes(ownerKey.privateKey)

  cached = await Authenticator.initializeAuthChain(
    ownerKey.address,
    { address: sessionKey.address, publicKey: sessionKey.publicKey, privateKey: sessionKey.privateKey },
    LIFESPAN_MINUTES,
    async (message: string) => ethSign(ownerPkBytes, message)
  )
  return cached
}

export { getGuestIdentity }
