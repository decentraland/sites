// Field names are deliberately snake_case with an `fp_` prefix to match the
// analytics event contract used end-to-end (Segment events, data warehouse
// columns, the Rust launcher's emitter). The prefix avoids collisions with
// caller-supplied event properties when the fingerprint is spread into a
// Segment payload. The `naming-convention` rule is camelCase by default in
// this repo; opt out for this module so we don't keep adding per-line
// eslint-disable comments.
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
 * Field names and shapes must stay in lock-step with the Rust launcher
 * fingerprint emitter:
 *   https://github.com/decentraland/launcher-rust/blob/main/core/src/analytics/fingerprint.rs
 */
interface ClientFingerprint {
  /** Primary monitor width in CSS pixels. */
  fp_screen_width: number
  /** Primary monitor height in CSS pixels. */
  fp_screen_height: number
  /** Device pixel ratio (e.g. `2` on Retina, `1` on standard). */
  fp_device_pixel_ratio: number
  /** Logical CPU cores reported by the browser; `null` when the browser hides the value. */
  fp_hardware_concurrency: number | null
  /** IANA timezone name when available (e.g. `America/Argentina/Buenos_Aires`). */
  fp_timezone: string | null
  /** Primary `navigator.language` (e.g. `en-US`). */
  fp_language: string | null
  /**
   * `navigator.platform` value. Deprecated and increasingly browser-locked,
   * but still a useful low-cardinality signal (`Win32`, `MacIntel`, `Linux x86_64`).
   * Note the launcher reports this as `<os>/<arch>` (e.g. `windows/x86_64`);
   * the data warehouse join is expected to normalize across the two shapes.
   * Falls back to `null` if unavailable.
   */
  fp_platform: string | null
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

  let fp_timezone: string | null = null
  try {
    fp_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    // Old browsers / locked-down environments may throw — falls back to null.
  }

  return {
    fp_screen_width: window.screen?.width ?? 0,
    fp_screen_height: window.screen?.height ?? 0,
    fp_device_pixel_ratio: window.devicePixelRatio ?? 1,
    fp_hardware_concurrency: navigator.hardwareConcurrency ?? null,
    fp_timezone,
    fp_language: navigator.language ?? null,
    fp_platform: navigator.platform ?? null
  }
}

export { collectClientFingerprint }
export type { ClientFingerprint }
