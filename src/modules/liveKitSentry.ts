import { captureHandledError } from './captureHandledError'

interface LiveKitConnectErrorContext {
  /** Which room mount failed, so the three surfaces stay distinguishable in Sentry. */
  surface: 'scene_watcher' | 'cast_watcher' | 'cast_streamer'
  serverUrl?: string
}

/**
 * Only the host is reported. The gatekeeper hands out
 * `livekit:wss://host?access_token=<jwt>` envelopes, and while the parser strips that
 * param before it reaches the room, a crash report must not be the thing that carries
 * a token to Sentry.
 */
function toHost(serverUrl?: string): string | undefined {
  if (!serverUrl) return undefined
  try {
    return new URL(serverUrl).host
  } catch {
    return undefined
  }
}

// The visitor declining the camera or microphone prompt reaches `onError` as a
// `NotAllowedError`, because the room requests devices as part of connecting. That is
// a choice, not a failure: the streamer view already handles it and shows its own
// copy. Matched on the name and on the message, since the room hands over both a
// DOMException and an `Error` wrapping its text (SITES-2SP).
//
// Its siblings are deliberately not covered. `NotFoundError` (no device) and
// `NotReadableError` (device held by another app) have never shown up here, and each
// would earn its own line with an event to point at.
const DENIED_PERMISSION_REGEX = /NotAllowedError|Permission denied/i

function isDeniedPermission(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return error.name === 'NotAllowedError' || DENIED_PERMISSION_REGEX.test(error.message)
}

/**
 * Captures a LiveKit room connection failure in Sentry.
 *
 * `LiveKitRoom` catches the rejection from `room.connect()` itself and hands it to
 * `onError`, so with no handler a real failure (an expired token, a gatekeeper
 * outage, a missing url) is a `console.warn` and nothing else: the visitor waits
 * behind the connection toast and we get no signal at all.
 */
async function captureLiveKitConnectError(error: unknown, { surface, serverUrl }: LiveKitConnectErrorContext): Promise<void> {
  if (isDeniedPermission(error)) return
  await captureHandledError(error, { tags: { surface, host: toHost(serverUrl), feature: 'livekit' } })
}

export { captureLiveKitConnectError }
export type { LiveKitConnectErrorContext }
