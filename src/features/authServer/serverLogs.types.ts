import type { AuthIdentity } from '@dcl/crypto'

type ServerLogLevel = 'error' | 'warn' | 'debug' | 'info'

// One parsed line from the multiplayer-server `/logs` SSE stream.
interface ServerLogLine {
  // Stable key for list rendering (monotonic per stream).
  id: number
  // Epoch millis (best-effort; falls back to receive time).
  timestamp: number
  level: ServerLogLevel
  message: string
  // Any non-standard JSON fields the server attached, serialized for display.
  extra?: string
}

// Everything the signed `/logs` request needs. `sceneId`/`realmName` are the
// `<world>.dcl.eth` form; `parcel` is "x,y" ("0,0" for single-scene worlds).
interface ServerLogsScope {
  identity: AuthIdentity
  sceneId: string
  realmName: string
  parcel: string
}

export type { ServerLogLevel, ServerLogLine, ServerLogsScope }
