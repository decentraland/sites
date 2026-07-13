import type { Architecture, OperativeSystem } from '../types/download.types'
import type { DownloadPlace } from './segment'

type AuthState = 'authenticated' | 'anonymous'

interface DownloadTrackerContext {
  place?: DownloadPlace
  href: string
  os: OperativeSystem
  arch: Architecture
  // eslint-disable-next-line @typescript-eslint/naming-convention
  anon_user_id?: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  auth_state: AuthState
  revisit: number
  /**
   * Extra payload sprinkled into every event the tracker emits. Use for
   * shared metadata that lives independently of the tracker's core schema —
   * the client fingerprint snapshot is the canonical consumer.
   */
  extra?: Record<string, unknown>
}

interface DownloadTracker {
  started: () => void
  /**
   * `extra` carries event-level fields known only at resolution time (e.g.
   * `delivery_mode`, `gateway_request_id`). Merged before the core schema so
   * core fields win on any collision, matching `ctx.extra` in `buildBasePayload`.
   */
  success: (filename: string, bytesTransferred?: number, extra?: Record<string, unknown>) => void
  failed: (reason: string, extra?: Record<string, unknown>) => void
}

export type { AuthState, DownloadTracker, DownloadTrackerContext }
