/**
 * A download funnel event queued for guaranteed, unload-safe delivery via the
 * Segment HTTP Tracking API. Mirrors the event already fired through the
 * normal analytics.js path; the shared `eventId` is what lets the warehouse
 * dedupe the two copies (see `downloadBeacon.ts`).
 */
interface DownloadBeaconEvent {
  /** Segment event name (e.g. `download_started`). */
  event: string
  /** Event properties — the same object sent on the analytics.js copy. */
  properties: Record<string, unknown>
  /**
   * Anonymous identity to attribute the event to. Prefer the shared
   * `anon_user_id` so the beaconed copy ties to the same user as the
   * analytics.js copy; falls back to `eventId` when absent.
   */
  anonymousId?: string
  /**
   * Idempotency key, also surfaced in `properties.download_event_id`. The
   * warehouse dedupes the analytics.js copy and the beacon copy on this value.
   */
  eventId: string
}

export type { DownloadBeaconEvent }
