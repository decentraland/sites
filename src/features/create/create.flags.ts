import { useSyncExternalStore } from 'react'
import { FEATURE_FLAG } from '../../modules/ff'
import { timeoutSignal } from '../../utils/timeoutSignal'

// TEMPORARY gate: the /create sub-nav and the violet field behind the bars stay hidden
// until the wemotes-builder collections app ships. Flip `dapps-wemotes-builder` in the
// flags service to reveal them; once the app is stable, delete this module and un-gate.
// Same route-chunk-scoped pattern as features/invite/invite.flags.ts: this module must
// only be imported from the /create chunk so the homepage ships zero feature-flag bytes
// and fires zero feature-flag requests.
const FEATURE_FLAGS_URL = 'https://feature-flags.decentraland.org/dapps.json'
const FETCH_TIMEOUT_MS = 5_000

let remoteFlagEnabled = false
let fetchStarted = false
const listeners = new Set<() => void>()

async function runFetch(): Promise<void> {
  try {
    const response = await fetch(FEATURE_FLAGS_URL, { signal: timeoutSignal(FETCH_TIMEOUT_MS) })
    if (!response.ok) {
      throw new Error(`Feature flags responded with ${response.status}`)
    }
    const data = (await response.json()) as { flags?: Record<string, boolean> }
    remoteFlagEnabled = data?.flags?.[FEATURE_FLAG.wemotesBuilder] === true
  } catch (error) {
    // Default off: the create page simply renders without the sub-nav, its pre-release look.
    console.warn('[Create] feature flags fetch failed', error)
    remoteFlagEnabled = false
  }
  listeners.forEach(fn => fn())
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

/** Whether the wemotes-builder collections app is released (remote flag; false until loaded). */
function useWemotesBuilderEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** @internal — exported for testing; not part of this module's public contract. */
function resetCreateFlagsForTests(): void {
  remoteFlagEnabled = false
  fetchStarted = false
  listeners.clear()
}

export { resetCreateFlagsForTests, useWemotesBuilderEnabled }
