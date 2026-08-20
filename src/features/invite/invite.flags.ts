import { useSyncExternalStore } from 'react'
import { FEATURE_FLAG } from '../../modules/ff'
import { isDirectDownloadEnabled } from '../../utils/referrer'
import { timeoutSignal } from '../../utils/timeoutSignal'

// IMPORTANT: this module must only be imported from the invite route chunk
// (InvitePage / InviteHero). The flag fetch is intentionally scoped to that
// lazy chunk so the homepage ships zero feature-flag bytes and fires zero
// feature-flag requests (see CLAUDE.md — homepage Lighthouse budget).
// Fetched straight from the service. This used to go through an `/api/feature-flags`
// same-origin proxy, which silently broke the flag in production: prod is served from
// the CDN behind the Cloudflare worker, not Vercel, so the `vercel.json` rewrite never
// applied and the path fell through to the SPA catch-all — the request returned the
// index HTML, `response.json()` threw, and the flag read false forever.
// The proxy was never needed: the service answers with `access-control-allow-origin`
// reflecting the caller (verified for decentraland.org, .zone and localhost).
const FEATURE_FLAGS_URL = 'https://feature-flags.decentraland.org/dapps.json'
const FETCH_TIMEOUT_MS = 5_000

let remoteFlagEnabled = false
let fetchStarted = false
const listeners = new Set<() => void>()

function emitChange(): void {
  listeners.forEach(fn => fn())
}

async function runFetch(): Promise<void> {
  try {
    const response = await fetch(FEATURE_FLAGS_URL, { signal: timeoutSignal(FETCH_TIMEOUT_MS) })
    if (!response.ok) {
      throw new Error(`Feature flags responded with ${response.status}`)
    }
    const data = (await response.json()) as { flags?: Record<string, boolean> }
    remoteFlagEnabled = data?.flags?.[FEATURE_FLAG.inviteDirectDownload] === true
  } catch (error) {
    // Default off: the invite CTA falls back to the auth-login-first flow, which
    // also registers the referral (on the web) — a failed flag fetch loses nothing.
    console.warn('[Invite] feature flags fetch failed', error)
    remoteFlagEnabled = false
  }
  emitChange()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (!fetchStarted) {
    fetchStarted = true
    void runFetch()
  }
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): boolean {
  return remoteFlagEnabled
}

/**
 * Whether the invite direct-download flow is enabled: the per-environment
 * configuration gate AND the remote `dapps-invite-direct-download` flag.
 * Returns false until the remote flag loads (default off — the CTA renders
 * the auth-login-first flow, which also registers the referral).
 */
function useInviteDirectDownload(): boolean {
  const remoteEnabled = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return remoteEnabled && isDirectDownloadEnabled()
}

/** @internal — exported for testing (see invite.flags.spec.ts); not part of this module's public contract. */
function resetInviteFlagsForTests(): void {
  remoteFlagEnabled = false
  fetchStarted = false
  listeners.clear()
}

export { resetInviteFlagsForTests, useInviteDirectDownload }
