import type { AuthIdentity } from '@dcl/crypto'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'

const ACTIVE_ADDRESS_KEY = 'dcl:active-address'
const SSO_KEY_PREFIX = 'single-sign-on-'
const SSO_ADDRESS_PREFIX = 'single-sign-on-0x'

function readActivePointer(): string | null {
  try {
    const value = localStorage.getItem(ACTIVE_ADDRESS_KEY)
    return value ? value.toLowerCase() : null
  } catch {
    return null
  }
}

function writeActivePointer(address: string | null): void {
  try {
    if (address) {
      localStorage.setItem(ACTIVE_ADDRESS_KEY, address.toLowerCase())
    } else {
      localStorage.removeItem(ACTIVE_ADDRESS_KEY)
    }
  } catch {
    // Storage write failures are non-fatal — resolution still falls back to the heuristic scan.
  }
}

function hasValidIdentityFor(address: string): boolean {
  try {
    return localStorageGetIdentity(address.toLowerCase()) !== null
  } catch {
    return false
  }
}

type ActiveSelection = {
  bestAddress: string | null
  bestIdentity: AuthIdentity | null
}

type ScanResult = ActiveSelection & {
  validCount: number
}

function scanValidIdentities(): ScanResult {
  let bestAddress: string | null = null
  let bestIdentity: AuthIdentity | null = null
  let bestExpiration = 0
  let validCount = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(SSO_ADDRESS_PREFIX)) continue
      const address = key.slice(SSO_KEY_PREFIX.length)
      const identity = localStorageGetIdentity(address)
      if (!identity) continue
      validCount++
      const payload = identity.authChain?.[1]?.payload
      const match = payload ? String(payload).match(/Expiration: ([^\n]+)/) : null
      const expiration = match ? new Date(match[1]).getTime() : 0
      if (expiration > bestExpiration) {
        bestExpiration = expiration
        bestAddress = address
        bestIdentity = identity
      }
    }
  } catch {
    return { bestAddress: null, bestIdentity: null, validCount: 0 }
  }
  return { bestAddress, bestIdentity, validCount }
}

/**
 * Resolves the active wallet selection using the persistent pointer first,
 * then falling back to the heuristic scan. Auto-promotes the pointer when
 * exactly one valid identity exists and clears stale pointers on read.
 *
 * Shared by `resolveActiveAddress` (returns address) and `resolveActiveIdentity`
 * (returns identity) so the two stay in sync.
 */
function resolveActive(): ActiveSelection {
  const pointer = readActivePointer()
  if (pointer) {
    const identity = localStorageGetIdentity(pointer)
    if (identity) return { bestAddress: pointer, bestIdentity: identity }
    writeActivePointer(null)
  }
  const { bestAddress, bestIdentity, validCount } = scanValidIdentities()
  if (validCount === 1 && bestAddress) {
    writeActivePointer(bestAddress)
  }
  return { bestAddress, bestIdentity }
}

/**
 * Returns the address of the wallet the user is currently signed in as.
 *
 * Order of precedence:
 * 1. The persistent `dcl:active-address` pointer when its identity is still valid.
 * 2. The single valid identity when exactly one exists — auto-promoted to the pointer.
 * 3. The valid identity with the latest expiration (legacy heuristic). The pointer
 *    is left untouched so an authoritative signal (explicit switch, `accountsChanged`,
 *    sign-in completion) still gets the chance to set it.
 *
 * Stale pointers (set to an address whose identity is gone) are cleared on read.
 */
function resolveActiveAddress(): string | null {
  return resolveActive().bestAddress
}

function resolveActiveIdentity(): AuthIdentity | undefined {
  // Coerce internal `null` sentinel to `undefined` to match the optional-identity
  // shape consumers expect (see `useAuthIdentity`, `signedFetchFactory`).
  return resolveActive().bestIdentity ?? undefined
}

function isRelevantStorageKey(key: string | null): boolean {
  if (key === null) return true
  if (key === ACTIVE_ADDRESS_KEY) return true
  // Match the same prefix the scanner uses so non-address SSO writes don't
  // trigger pointless re-resolutions.
  if (key.startsWith(SSO_ADDRESS_PREFIX)) return true
  return false
}

export {
  ACTIVE_ADDRESS_KEY,
  hasValidIdentityFor,
  isRelevantStorageKey,
  readActivePointer,
  resolveActiveAddress,
  resolveActiveIdentity,
  writeActivePointer
}
