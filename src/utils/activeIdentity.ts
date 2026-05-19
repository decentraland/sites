import type { AuthIdentity } from '@dcl/crypto'
import { localStorageGetIdentity } from '@dcl/single-sign-on-client'

const ACTIVE_ADDRESS_KEY = 'dcl:active-address'
const SIGN_IN_PENDING_KEY = 'dcl:sign-in-pending'
const SIGN_IN_PENDING_SNAPSHOT_KEY = 'dcl:sign-in-pending-snapshot'
const SIGN_IN_PENDING_TTL_MS = 10 * 60 * 1000
const SSO_KEY_PREFIX = 'single-sign-on-'
const SSO_ADDRESS_PREFIX = 'single-sign-on-0x'

function ephemeralFingerprintFromIdentity(identity: AuthIdentity | null | undefined): string {
  // The ECDSA_EPHEMERAL payload carries a freshly generated public key on
  // every sign-in, so it changes even when the user signs in with the same
  // wallet address (e.g. OTP/Magic emails that map to a stable on-chain key).
  return String(identity?.authChain?.[1]?.payload ?? '')
}

function listIdentityFingerprints(): Record<string, string> {
  const fingerprints: Record<string, string> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(SSO_ADDRESS_PREFIX)) continue
      const address = key.slice(SSO_KEY_PREFIX.length).toLowerCase()
      let identity: AuthIdentity | null = null
      try {
        identity = localStorageGetIdentity(address)
      } catch {
        identity = null
      }
      // Always include the address even when the identity is missing or
      // unreadable so a wallet whose entry pre-existed isn't misclassified
      // as a newcomer on return.
      fingerprints[address] = ephemeralFingerprintFromIdentity(identity)
    }
  } catch {
    return {}
  }
  return fingerprints
}

/**
 * Records that the user has just left for the auth dapp, along with a snapshot
 * of the ephemeral fingerprint we had for every known wallet. On return:
 *  - An address absent from the snapshot is a brand-new wallet — the auth dapp
 *    wrote it during this redirect, and it wins.
 *  - An address present in the snapshot whose fingerprint changed is a
 *    refreshed wallet — the auth dapp re-signed an existing wallet during
 *    this redirect (OTP/Magic with a stable per-email address). It also wins.
 *
 * Either signal beats a pre-existing pointer regardless of expiration ordering,
 * because Magic/OTP ephemerals may have a shorter TTL than a pre-existing
 * MetaMask identity — a max-expiration heuristic would keep the user on the
 * previous wallet.
 */
function markSignInPending(): void {
  try {
    const fingerprints = listIdentityFingerprints()
    localStorage.setItem(SIGN_IN_PENDING_KEY, String(Date.now()))
    localStorage.setItem(SIGN_IN_PENDING_SNAPSHOT_KEY, JSON.stringify(fingerprints))

    console.log('[wallet-switch] markSignInPending', {
      pointer: localStorage.getItem(ACTIVE_ADDRESS_KEY),
      snapshotAddresses: Object.keys(fingerprints),
      snapshotFingerprints: fingerprints,
      timestamp: Date.now()
    })
  } catch (err) {
    console.warn('[wallet-switch] markSignInPending FAILED', err)
    // Non-fatal: without the flag, fresh sign-ins fall back to the standard
    // resolution path (pointer → auto-promote → max-expiration heuristic).
  }
}

type PendingSignIn = {
  active: boolean
  fingerprints: Record<string, string>
}

function consumePendingSignIn(): PendingSignIn {
  const empty: PendingSignIn = { active: false, fingerprints: {} }
  try {
    const value = localStorage.getItem(SIGN_IN_PENDING_KEY)
    const snapshotRaw = localStorage.getItem(SIGN_IN_PENDING_SNAPSHOT_KEY)
    if (!value) {
      if (snapshotRaw !== null) localStorage.removeItem(SIGN_IN_PENDING_SNAPSHOT_KEY)

      console.log('[wallet-switch] consumePendingSignIn: no pending flag', { snapshotRawWasPresent: snapshotRaw !== null })
      return empty
    }
    localStorage.removeItem(SIGN_IN_PENDING_KEY)
    localStorage.removeItem(SIGN_IN_PENDING_SNAPSHOT_KEY)
    const ts = Number(value)
    if (!Number.isFinite(ts) || Date.now() - ts >= SIGN_IN_PENDING_TTL_MS) {
      console.log('[wallet-switch] consumePendingSignIn: flag expired or invalid', { rawValue: value, ts, ageMs: Date.now() - ts })
      return empty
    }
    let parsed: unknown = {}
    if (snapshotRaw) {
      try {
        parsed = JSON.parse(snapshotRaw)
      } catch (err) {
        console.warn('[wallet-switch] consumePendingSignIn: snapshot JSON malformed', { snapshotRaw, err })
        // Malformed snapshot — treat as empty so any current identity is a newcomer.
      }
    }
    const fingerprints: Record<string, string> = {}
    let formatUsed: 'modern' | 'legacy-array' | 'empty' = 'empty'
    if (Array.isArray(parsed)) {
      formatUsed = 'legacy-array'
      // Legacy snapshot format (addresses only). Preserve the membership
      // signal so newcomer detection still works during the rollout window.
      for (const value of parsed) {
        if (typeof value === 'string') fingerprints[value.toLowerCase()] = ''
      }
    } else if (parsed && typeof parsed === 'object') {
      formatUsed = 'modern'
      for (const [address, fingerprint] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof address === 'string' && typeof fingerprint === 'string') {
          fingerprints[address.toLowerCase()] = fingerprint
        }
      }
    }

    console.log('[wallet-switch] consumePendingSignIn: pending active', {
      ageMs: Date.now() - ts,
      formatUsed,
      snapshotAddresses: Object.keys(fingerprints),
      snapshotFingerprints: fingerprints
    })
    return { active: true, fingerprints }
  } catch (err) {
    console.warn('[wallet-switch] consumePendingSignIn FAILED', err)
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
 * wallet that was either added or refreshed during the round-trip is treated
 * as authoritative and gets promoted to the pointer:
 *   - A newcomer (address absent from the pre-redirect snapshot) wins outright.
 *   - A refreshed identity (address present in the snapshot but with a new
 *     ECDSA_EPHEMERAL payload) also wins — this covers OTP/Magic flows whose
 *     wallet address is stable per email, so re-signing in regenerates the
 *     ephemeral key without changing the address.
 *
 * Shared by `resolveActiveAddress` (returns address) and `resolveActiveIdentity`
 * (returns identity) so the two stay in sync.
 */
function resolveActive(): ActiveSelection {
  const pending = consumePendingSignIn()
  if (pending.active) {
    const records = listValidIdentities()
    // Build a comparison row per record so the diagnostic log shows exactly
    // which identity matched (or didn't match) the snapshot.
    const comparison = records.map(rec => {
      const previousFingerprint = pending.fingerprints[rec.address]
      const currentFingerprint = ephemeralFingerprintFromIdentity(rec.identity)
      let verdict: 'newcomer' | 'refreshed' | 'unchanged' | 'legacy-membership'
      if (previousFingerprint === undefined) verdict = 'newcomer'
      else if (previousFingerprint === '') verdict = 'legacy-membership'
      else if (previousFingerprint !== currentFingerprint) verdict = 'refreshed'
      else verdict = 'unchanged'
      return { address: rec.address, expiration: rec.expiration, previousFingerprint, currentFingerprint, verdict }
    })
    const candidates = records.filter((_, i) => comparison[i].verdict === 'newcomer' || comparison[i].verdict === 'refreshed')

    console.log('[wallet-switch] resolveActive: pending path', {
      knownAddresses: records.map(r => r.address),
      comparison,
      candidateCount: candidates.length
    })
    if (candidates.length > 0) {
      // If the auth dapp wrote more than one identity (rare — concurrent flows),
      // tie-break on latest expiration so we still pick a deterministic winner.
      const fresh = pickByLatestExpiration(candidates)
      if (fresh.bestAddress) {
        writeActivePointer(fresh.bestAddress)

        console.log('[wallet-switch] resolveActive: promoted candidate', { picked: fresh.bestAddress })
        return fresh
      }
    }
    // No newcomer and no refresh (auth canceled): fall through to the standard
    // resolution path so we don't leave the user blank.

    console.log('[wallet-switch] resolveActive: no candidates, falling through to pointer/heuristic')
  }

  const pointer = readActivePointer()
  if (pointer) {
    const identity = localStorageGetIdentity(pointer)
    if (identity) {
      console.log('[wallet-switch] resolveActive: returning pointer', { pointer })
      return { bestAddress: pointer, bestIdentity: identity }
    }
    writeActivePointer(null)
  }
  const records = listValidIdentities()
  if (records.length === 1) {
    writeActivePointer(records[0].address)

    console.log('[wallet-switch] resolveActive: auto-promoted single identity', { picked: records[0].address })
    return { bestAddress: records[0].address, bestIdentity: records[0].identity }
  }
  const heuristic = pickByLatestExpiration(records)

  console.log('[wallet-switch] resolveActive: heuristic (max expiration)', {
    knownAddresses: records.map(r => ({ address: r.address, expiration: r.expiration })),
    picked: heuristic.bestAddress
  })
  return heuristic
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
