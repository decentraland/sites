import type { AuthIdentity } from '@dcl/crypto'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'

const ACTIVE_ADDRESS_KEY = 'dcl:active-address'
const SIGN_IN_PENDING_KEY = 'dcl:sign-in-pending'
const SIGN_IN_PENDING_SNAPSHOT_KEY = 'dcl:sign-in-pending-snapshot'
const SIGN_IN_PENDING_TTL_MS = 10 * 60 * 1000
const SSO_KEY_PREFIX = 'single-sign-on-'
const SSO_ADDRESS_PREFIX = 'single-sign-on-0x'

function listKnownAddresses(): string[] {
  const addresses: string[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(SSO_ADDRESS_PREFIX)) continue
      addresses.push(key.slice(SSO_KEY_PREFIX.length).toLowerCase())
    }
  } catch {
    return []
  }
  return addresses
}

/**
 * Records that the user has just left for the auth dapp, along with a snapshot
 * of the addresses we already had identities for. On return, the address that
 * was NOT in the snapshot is the one the auth dapp just wrote — and wins over
 * any pre-existing identity regardless of expiration ordering.
 *
 * Storing only a timestamp is not enough: Magic/OTP ephemerals may have a
 * shorter TTL than a pre-existing MetaMask identity, so a max-expiration
 * heuristic would keep the user on the previous wallet.
 */
function markSignInPending(): void {
  try {
    localStorage.setItem(SIGN_IN_PENDING_KEY, String(Date.now()))
    localStorage.setItem(SIGN_IN_PENDING_SNAPSHOT_KEY, JSON.stringify(listKnownAddresses()))
  } catch {
    // Non-fatal: without the flag, fresh sign-ins fall back to the standard
    // resolution path (pointer → auto-promote → max-expiration heuristic).
  }
}

type PendingSignIn = {
  active: boolean
  snapshot: Set<string>
}

function consumePendingSignIn(): PendingSignIn {
  const empty: PendingSignIn = { active: false, snapshot: new Set() }
  try {
    const value = localStorage.getItem(SIGN_IN_PENDING_KEY)
    const snapshotRaw = localStorage.getItem(SIGN_IN_PENDING_SNAPSHOT_KEY)
    if (!value) {
      if (snapshotRaw !== null) localStorage.removeItem(SIGN_IN_PENDING_SNAPSHOT_KEY)
      return empty
    }
    localStorage.removeItem(SIGN_IN_PENDING_KEY)
    localStorage.removeItem(SIGN_IN_PENDING_SNAPSHOT_KEY)
    const ts = Number(value)
    if (!Number.isFinite(ts) || Date.now() - ts >= SIGN_IN_PENDING_TTL_MS) return empty
    let parsed: unknown = []
    if (snapshotRaw) {
      try {
        parsed = JSON.parse(snapshotRaw)
      } catch {
        // Malformed snapshot — treat as empty so any current identity is a newcomer.
      }
    }
    const addresses = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').map(s => s.toLowerCase()) : []
    return { active: true, snapshot: new Set(addresses) }
  } catch {
    return empty
  }
}

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

type IdentityRecord = {
  address: string
  identity: AuthIdentity
  expiration: number
}

function listValidIdentities(): IdentityRecord[] {
  const records: IdentityRecord[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(SSO_ADDRESS_PREFIX)) continue
      const address = key.slice(SSO_KEY_PREFIX.length).toLowerCase()
      const identity = localStorageGetIdentity(address)
      if (!identity) continue
      const payload = identity.authChain?.[1]?.payload
      const match = payload ? String(payload).match(/Expiration: ([^\n]+)/) : null
      const expiration = match ? new Date(match[1]).getTime() : 0
      records.push({ address, identity, expiration })
    }
  } catch {
    return []
  }
  return records
}

function pickByLatestExpiration(records: IdentityRecord[]): ActiveSelection {
  let best: IdentityRecord | null = null
  for (const rec of records) {
    if (!best || rec.expiration > best.expiration) best = rec
  }
  return {
    bestAddress: best?.address ?? null,
    bestIdentity: best?.identity ?? null
  }
}

/**
 * Resolves the active wallet selection using the persistent pointer first,
 * then falling back to the heuristic scan. Auto-promotes the pointer when
 * exactly one valid identity exists and clears stale pointers on read.
 *
 * If a sign-in is pending (the user just returned from the auth dapp), the
 * address that wasn't present pre-redirect is treated as authoritative —
 * that's the one the auth dapp just wrote — and gets promoted to the pointer.
 *
 * Shared by `resolveActiveAddress` (returns address) and `resolveActiveIdentity`
 * (returns identity) so the two stay in sync.
 */
function resolveActive(): ActiveSelection {
  const pending = consumePendingSignIn()
  if (pending.active) {
    const records = listValidIdentities()
    const newcomers = records.filter(rec => !pending.snapshot.has(rec.address))
    if (newcomers.length > 0) {
      // If the auth dapp wrote more than one identity (rare — concurrent flows),
      // tie-break on latest expiration so we still pick a deterministic winner.
      const fresh = pickByLatestExpiration(newcomers)
      if (fresh.bestAddress) {
        writeActivePointer(fresh.bestAddress)
        return fresh
      }
    }
    // No newcomer (auth canceled, or user re-signed-in with the same wallet):
    // fall through to the standard resolution path so we don't leave the user blank.
  }

  const pointer = readActivePointer()
  if (pointer) {
    const identity = localStorageGetIdentity(pointer)
    if (identity) return { bestAddress: pointer, bestIdentity: identity }
    writeActivePointer(null)
  }
  const records = listValidIdentities()
  if (records.length === 1) {
    writeActivePointer(records[0].address)
    return { bestAddress: records[0].address, bestIdentity: records[0].identity }
  }
  return pickByLatestExpiration(records)
}

/**
 * Returns the address of the wallet the user is currently signed in as.
 *
 * Order of precedence:
 * 1. The newcomer identity written during a pending sign-in (auth dapp round-trip).
 * 2. The persistent `dcl:active-address` pointer when its identity is still valid.
 * 3. The single valid identity when exactly one exists — auto-promoted to the pointer.
 * 4. The valid identity with the latest expiration (legacy heuristic). The pointer
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
  SIGN_IN_PENDING_KEY,
  SIGN_IN_PENDING_SNAPSHOT_KEY,
  hasValidIdentityFor,
  isRelevantStorageKey,
  markSignInPending,
  readActivePointer,
  resolveActiveAddress,
  resolveActiveIdentity,
  writeActivePointer
}
