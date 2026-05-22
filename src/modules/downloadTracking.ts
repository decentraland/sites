import { DownloadPlace, SegmentEvent } from './segment'
import type { DownloadTrackFn, DownloadTracker, DownloadTrackerContext } from './downloadTracking.types'

const buildBasePayload = (ctx: DownloadTrackerContext): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
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
 * Builds a tracker bound to a single download attempt.
 *
 * Captures `started_at` at the moment `started()` is called (not at
 * construction) so the timestamp survives when Segment is still lazy-loading
 * and the event is enqueued upstream — the data team can reconstruct timing
 * from the payload regardless of Segment's ingestion delay.
 */
function createDownloadTracker(track: DownloadTrackFn, ctx: DownloadTrackerContext): DownloadTracker {
  let startedAt: number | null = null

  return {
    started: () => {
      startedAt = Date.now()
      track(SegmentEvent.DOWNLOAD_STARTED, {
        ...buildBasePayload(ctx),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        started_at: startedAt
      })
    },
    success: (filename, bytesTransferred) => {
      const succeededAt = Date.now()
      const anchor = startedAt ?? succeededAt
      const payload: Record<string, unknown> = {
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
      track(SegmentEvent.DOWNLOAD_SUCCESS, payload)
    },
    failed: reason => {
      const failedAt = Date.now()
      const anchor = startedAt ?? failedAt
      track(SegmentEvent.DOWNLOAD_FAILED, {
        ...buildBasePayload(ctx),
        reason,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        started_at: anchor,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        failed_at: failedAt,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        duration_ms: failedAt - anchor
      })
    }
  }
}

export { createDownloadTracker }
