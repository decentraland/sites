import { useCallback, useSyncExternalStore } from 'react'
import { timeoutSignal } from '../utils/timeoutSignal'
import { FEATURE_FLAG } from './ff'
import { persistSegmentProxyDisabled } from './segmentKillSwitch'

// IMPORTANT: this module must only be reached from a lazy route chunk (see the per-feature
// `*.flags.ts` wrappers). Importing it from the homepage or any other lightweight route would ship
// feature-flag bytes and fire a feature-flag request there — see CLAUDE.md, homepage Lighthouse budget.
//
// Fetched straight from the service. This used to go through an `/api/feature-flags` same-origin
// proxy, which silently broke the flag in production: prod is served from the CDN behind the
// Cloudflare worker, not Vercel, so the `vercel.json` rewrite never applied and the path fell through
// to the SPA catch-all — the request returned the index HTML, `response.json()` threw, and the flag
// read false forever. The proxy was never needed: the service answers with
// `access-control-allow-origin` reflecting the caller (verified for decentraland.org, .zone and localhost).
const FEATURE_FLAGS_URL = 'https://feature-flags.decentraland.org/dapps.json'
const FETCH_TIMEOUT_MS = 5_000

let flags: Record<string, boolean> = {}
let fetchStarted = false
const listeners = new Set<() => void>()

function emitChange(): void {
  listeners.forEach(listener => listener())
}

async function runFetch(): Promise<void> {
  try {
    const response = await fetch(FEATURE_FLAGS_URL, { signal: timeoutSignal(FETCH_TIMEOUT_MS) })
    if (!response.ok) {
      throw new Error(`Feature flags responded with ${response.status}`)
    }
    const data = (await response.json()) as { flags?: Record<string, boolean> }
    flags = data?.flags ?? {}
    // Analytics boots before this fetch can answer, so the Segment proxy kill switch is decided
    // from the value persisted by an earlier page load. This is the only place that learns the
    // flag without costing the homepage a request, so it is the only place that writes it.
    // Deliberately inside the try: a failed fetch must leave the last known value alone.
    persistSegmentProxyDisabled(isFeatureFlagEnabled(FEATURE_FLAG.segmentKillSwitch))
  } catch (error) {
    // Default off for every flag: a failed fetch must never turn a gated feature on.
    console.warn('[featureFlags] fetch failed', error)
    flags = {}
  }
  emitChange()
}

// One fetch per page load, shared by every flag and every consumer: the first subscriber starts it,
// later ones just attach to the same result.
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

function isFeatureFlagEnabled(name: string): boolean {
  return flags[name] === true
}

/**
 * Reads one remote flag from `dapps.json`. Returns false until the file loads, so a gated feature
 * stays off while the fetch is in flight and if it fails outright.
 */
function useRemoteFeatureFlag(name: string): boolean {
  const getSnapshot = useCallback(() => isFeatureFlagEnabled(name), [name])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** @internal — exported for testing; not part of this module's public contract. */
function resetFeatureFlagsForTests(): void {
  flags = {}
  fetchStarted = false
  listeners.clear()
}

export { resetFeatureFlagsForTests, useRemoteFeatureFlag }
