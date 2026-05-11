// Field names are deliberately snake_case to match the analytics event
// contract used end-to-end (Segment events, data warehouse columns, the
// Rust launcher's emitter). The `naming-convention` rule is camelCase by
// default in this repo; opt out for this module so we don't keep adding
// per-line eslint-disable comments.
/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Stable signals about the user's environment that the launcher (running
 * as a desktop app on the same machine) can also read from the OS, so a
 * data warehouse can join landing-site events with launcher install events
 * without an embedded user-level identifier.
 *
 * We don't try to be unique per user — we collect a handful of features
 * that, combined with the user's IP and event timestamp, narrow down the
 * matching window to a manageable set of candidates. The actual scoring
 * lives in the data team's Segment Functions / SQL join.
 *
 * Field names use snake_case to match the convention used by the launcher
 * Segment client (Rust / `analytics_queue.db`), so the join columns line
 * up without renaming.
 */
interface ClientFingerprint {
  /** Primary monitor width in CSS pixels. */
  screen_width: number
  /** Primary monitor height in CSS pixels. */
  screen_height: number
  /** Device pixel ratio (e.g. `2` on Retina, `1` on standard). */
  device_pixel_ratio: number
  /** Bits per pixel for the primary display. */
  color_depth: number
  /** Logical CPU cores reported by the browser, capped at 8 by some browsers. */
  hardware_concurrency: number
  /** IANA timezone name when available (e.g. `America/Argentina/Buenos_Aires`). */
  timezone: string | null
  /** Minutes offset from UTC at the moment of the call (negative for east of UTC). */
  timezone_offset_minutes: number
  /** Primary `navigator.language` (e.g. `en-US`). */
  language: string | null
  /**
   * `navigator.platform` value. Deprecated and increasingly browser-locked,
   * but still a useful low-cardinality signal (`Win32`, `MacIntel`, `Linux x86_64`).
   * Fall back to `null` if unavailable.
   */
  platform: string | null
}

/**
 * Returns a snapshot of the current browser/device fingerprint signals.
 * Safe to call from anywhere in the page lifecycle — no I/O, no async.
 *
 * Returns `null` only if `window`/`navigator` are unavailable (SSR / unit
 * tests); callers should be tolerant of that case rather than crashing.
 */
function collectClientFingerprint(): ClientFingerprint | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null
  }

  let timezone: string | null = null
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    // Old browsers / locked-down environments may throw — falls back to null.
  }

  return {
    screen_width: window.screen?.width ?? 0,
    screen_height: window.screen?.height ?? 0,
    device_pixel_ratio: window.devicePixelRatio ?? 1,
    color_depth: window.screen?.colorDepth ?? 0,
    hardware_concurrency: navigator.hardwareConcurrency ?? 0,
    timezone,
    timezone_offset_minutes: new Date().getTimezoneOffset(),
    language: navigator.language ?? null,
    platform: navigator.platform ?? null
  }
}

export { collectClientFingerprint }
export type { ClientFingerprint }
