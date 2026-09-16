import { DownloadPlace, SegmentEvent } from './segment'
import { ensureSegmentAnonymousId } from './segmentAnonymousId'
import { postSegmentEvent } from './segmentBeacon'
import type { AuthState, DownloadTracker, DownloadTrackerContext } from './downloadTracking.types'

/**
 * Maps the localStorage identity presence flag to the `auth_state` dimension
 * shared by every `download_*` event. Extracted so the Explorer and Creator
 * Hub funnels derive it identically instead of repeating the ternary.
 */
const toAuthState = (hasValidIdentity: boolean): AuthState => (hasValidIdentity ? 'authenticated' : 'anonymous')

const buildBasePayload = (ctx: DownloadTrackerContext): Record<string, unknown> => {
  // ctx.extra goes first so the core schema fields below take precedence on
  // any accidental key collision (e.g. an extra incorrectly named `os`).
  const payload: Record<string, unknown> = {
    ...(ctx.extra ?? {}),
    href: ctx.href,
    os: ctx.os,
    arch: ctx.arch,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    auth_state: ctx.auth_state,
    revisit: ctx.revisit
  }
  if (ctx.place && ctx.place !== DownloadPlace.UNKNOWN) {
    payload.place = ctx.place
  }
  if (ctx.anon_user_id) {
    payload.anon_user_id = ctx.anon_user_id
  }
  return payload
}

/**
 * Appends the `track_called_at`, `track_delivered_at`, and `track_deferred`
 * audit fields that `useDeferredTrack` normally injects. These events now
 * always bypass the queue (beacon transport), so `track_deferred` is always
 * `true` — mirrors the convention in `useDownloadClick`'s beacon path.
 */
const withTrackAuditFields = (payload: Record<string, unknown>): Record<string, unknown> => {
  const now = Date.now()
  return {
    ...payload,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    track_called_at: now,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    track_delivered_at: now,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    track_deferred: true
  }
}

/**
 * Builds a tracker bound to a single download attempt.
 *
 * Captures `started_at` at the moment `started()` is called (not at
 * construction) so the timestamp survives Segment's own ingestion delay —
 * the data team can reconstruct timing from the payload regardless.
 *
 * Fires every event over `postSegmentEvent` (unload-safe `sendBeacon` /
 * `fetch keepalive`) with `ensureSegmentAnonymousId()` instead of routing
 * through `useDeferredTrack`'s component-scoped queue. `/download_success` is
 * the page users are most likely to abruptly leave (they're about to run the
 * installer they just downloaded), and that queue drops any still-pending
 * event on unmount — silently losing a meaningful fraction of these events.
 * See `useDownloadClick`/`downloadFunnelExit` for the same precedent.
 */
function createDownloadTracker(ctx: DownloadTrackerContext): DownloadTracker {
  let startedAt: number | null = null
  const anonymousId = ensureSegmentAnonymousId()

  return {
    started: () => {
      startedAt = Date.now()
      postSegmentEvent(
        SegmentEvent.DOWNLOAD_STARTED,
        withTrackAuditFields({
          ...buildBasePayload(ctx),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          started_at: startedAt
        }),
        anonymousId
      )
    },
    success: (filename, bytesTransferred, extra) => {
      const succeededAt = Date.now()
      const anchor = startedAt ?? succeededAt
      const payload: Record<string, unknown> = {
        ...(extra ?? {}),
        ...buildBasePayload(ctx),
        filename,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        started_at: anchor,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        succeeded_at: succeededAt,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        duration_ms: succeededAt - anchor
      }
      if (bytesTransferred !== undefined) {
        payload.bytes_transferred = bytesTransferred
      }
      postSegmentEvent(SegmentEvent.DOWNLOAD_SUCCESS, withTrackAuditFields(payload), anonymousId)
    },
    failed: (reason, extra) => {
      const failedAt = Date.now()
      const anchor = startedAt ?? failedAt
      postSegmentEvent(
        SegmentEvent.DOWNLOAD_FAILED,
        withTrackAuditFields({
          ...(extra ?? {}),
          ...buildBasePayload(ctx),
          reason,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          started_at: anchor,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          failed_at: failedAt,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          duration_ms: failedAt - anchor
        }),
        anonymousId
      )
    }
  }
}

export { createDownloadTracker, toAuthState }
