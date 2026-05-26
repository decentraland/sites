import type { Architecture, OperativeSystem } from '../types/download.types'
import type { DownloadPlace, SegmentEvent } from './segment'

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

type DownloadTrackFn = (event: SegmentEvent, payload: Record<string, unknown>) => void

interface DownloadTracker {
  started: () => void
  success: (filename: string, bytesTransferred?: number) => void
  failed: (reason: string) => void
}

export type { AuthState, DownloadTrackFn, DownloadTracker, DownloadTrackerContext }
