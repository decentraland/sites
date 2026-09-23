import type { AuthState } from './downloadTracking.types'

/**
 * Snapshot of the download funnel state captured when the user leaves
 * `/download_success`. Emitted as the `download_funnel_exit` diagnostic event
 * so we can measure how many sessions depart before the `download_*` events
 * fire (or are delivered) — i.e. confirm the funnel drop is users closing the
 * tab early rather than downloads actually failing.
 */
interface DownloadFunnelExitData {
  os: string
  arch: string
  /** Resolved DownloadPlace (may be the `unknown` sentinel). */
  place: string
  anonUserId?: string
  /** `click_id` from the originating download CTA click, when correlation is still fresh. */
  clickId?: string
  /** Whether `download_started` had been fired by the time the page closed. */
  startedFired: boolean
  /** Whether `download_success` had been fired by the time the page closed. */
  successFired: boolean
  /** Whether `download_failed` had been fired by the time the page closed. */
  failedFired: boolean
  /** Milliseconds between page mount and departure. */
  msOnPage: number
  /** Revisit counter for this os:arch within the session (0 = first visit). */
  revisit: number
  /** `'authenticated'` | `'anonymous'` at departure time. */
  authState: AuthState
}

export type { DownloadFunnelExitData }
