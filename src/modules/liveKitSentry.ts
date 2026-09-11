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

/**
 * Captures a LiveKit room connection failure in Sentry.
 *
 * `LiveKitRoom` catches the rejection from `room.connect()` itself and hands it to
 * `onError`, so with no handler a real failure (an expired token, a gatekeeper
 * outage, a missing url) is a `console.warn` and nothing else: the visitor waits
 * behind the connection toast and we get no signal at all.
 *
 * `feature` goes after the spread so a caller cannot drop it, matching
 * `captureDiscoverError`.
 */
async function captureLiveKitConnectError(error: unknown, { surface, serverUrl }: LiveKitConnectErrorContext): Promise<void> {
  await captureHandledError(error, { tags: { surface, host: toHost(serverUrl), feature: 'livekit' } })
}

export { captureLiveKitConnectError }
export type { LiveKitConnectErrorContext }
