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

// The room requests the camera and microphone as part of connecting, so two device
// conditions reach `onError` that are the visitor's, not ours, and are not reported:
//
// - Declining the prompt (`NotAllowedError`): a choice, and the streamer view already
//   handles it (SITES-2SP).
// - A device held by another app (`NotReadableError`: "Could not start video source",
//   "Device in use"). The room connects with that device off, and the streamer turns it
//   on again once it is free (SITES-2T1, SITES-2V2).
//
// Both are matched on the name and on the message, since the room hands over both a
// DOMException and an `Error` wrapping its text. `NotFoundError` (no device) is still
// reported: it has never shown up here, and would earn its own line with an event to
// point at.
const EXPECTED_DEVICE_ERROR_NAMES = new Set(['NotAllowedError', 'NotReadableError'])
const EXPECTED_DEVICE_ERROR_REGEX =
  /NotAllowedError|Permission denied|NotReadableError|Could not start (?:video|audio) source|Device in use/i

function isExpectedDeviceError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return EXPECTED_DEVICE_ERROR_NAMES.has(error.name) || EXPECTED_DEVICE_ERROR_REGEX.test(error.message)
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
  if (isExpectedDeviceError(error)) return
  await captureHandledError(error, { tags: { surface, host: toHost(serverUrl), feature: 'livekit' } })
}

export { captureLiveKitConnectError }
export type { LiveKitConnectErrorContext }
