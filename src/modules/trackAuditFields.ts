/**
 * Appends the `track_called_at`, `track_delivered_at`, and `track_deferred`
 * audit fields that `useDeferredTrack` normally injects, so a warehouse query can
 * tell an event delivered by this beacon from one sent through analytics-next.
 * Beacon events never go through the queue, so `track_deferred` is always `true`,
 * the same convention as `useDownloadClick`'s beacon path.
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

export { withTrackAuditFields }
