import { OperativeSystem } from '../types/download.types'
import { downloadFileWithProgress, triggerFileDownload } from './file'
import type { StreamOrFallbackArgs } from './streamOrFallback.types'

// Fallback hold for the Windows fetch-error path. The HEAD that powers the
// macOS adaptive estimate would likely fail for the same reason the streamed
// fetch did (CORS, network), so we hardcode a coarse approximation here
// instead of trying twice. The native anchor takes over the actual save and
// the browser's download manager remains visible to the user as the real
// progress signal.
const FALLBACK_LOADER_HOLD_MS = 4000

// Static bandwidth assumption used as the basis for the modal hold estimate.
//
// We intentionally do NOT read `navigator.connection.downlink`: per the
// Network Information API W3C spec, Chrome caps `downlink` at ~10 Mbps for
// privacy, regardless of the user's real bandwidth (verified empirically —
// a user on 100 Mbps reads `downlink === 9.3`). Trusting that value
// produces a wildly pessimistic estimate that clamps to the max hold for
// every user, making the modal hang ~10 s on near-instant downloads.
// Safari and Firefox don't expose the API at all.
//
// A static assumption of modern broadband is more accurate in practice than
// the API value, and lets us reason about the worst-case hold time
// deterministically.
const ASSUMED_DOWNLINK_MBPS = 100

// Wall-clock margin added on top of the pure transfer estimate to absorb
// connection setup, server-side TTFB, and the browser's write-to-disk after
// the bytes arrive.
const ESTIMATE_SAFETY_MARGIN_MS = 500

// Always hold for at least this long so the modal doesn't blink-and-vanish
// on a cache hit / sub-second transfer.
const ESTIMATE_MIN_HOLD_MS = 800

// Never hang a static (no progress bar) modal beyond this. Past this point
// the browser's own download manager already shows as the user-facing
// progress signal — keeping our modal up longer would just look stuck.
const ESTIMATE_MAX_HOLD_MS = 4000

/**
 * Sleeps for `ms` milliseconds, resolving early if `signal` aborts. Resolves
 * (rather than rejecting) on abort so callers can decide whether the caller
 * was already past the point of caring — e.g. the download has already been
 * dispatched to the OS, so an aborted hold just means "stop waiting and go
 * tear down the UI".
 */
const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise(resolve => {
    if (signal?.aborted) return resolve()
    const id = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(id)
        resolve()
      },
      { once: true }
    )
  })

const fetchContentLength = async (url: string, signal?: AbortSignal): Promise<number | null> => {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      signal
    })
    if (!response.ok) return null
    const header = response.headers.get('content-length')
    if (!header) return null
    const size = parseInt(header, 10)
    return Number.isFinite(size) && size > 0 ? size : null
  } catch {
    return null
  }
}

/**
 * Estimates how long the modal should stay open given the file size and a
 * static broadband assumption. Returns the clamped hold in milliseconds.
 *
 * - Reads `Content-Length` from a HEAD request to the gateway.
 * - Uses `ASSUMED_DOWNLINK_MBPS` (NOT `navigator.connection.downlink`, which
 *   Chrome caps and Safari/Firefox don't expose — see constant docs above).
 * - Adds a margin for handshake / write-to-disk variance and clamps the
 *   result so the modal can't disappear instantly nor hang forever.
 */
const estimateDownloadHoldMs = async (url: string, signal?: AbortSignal): Promise<number> => {
  const sizeBytes = await fetchContentLength(url, signal)
  if (sizeBytes === null) return ESTIMATE_MIN_HOLD_MS

  const downlinkBytesPerSec = (ASSUMED_DOWNLINK_MBPS * 1024 * 1024) / 8
  const transferMs = (sizeBytes / downlinkBytesPerSec) * 1000
  const total = transferMs + ESTIMATE_SAFETY_MARGIN_MS
  return Math.min(ESTIMATE_MAX_HOLD_MS, Math.max(ESTIMATE_MIN_HOLD_MS, total))
}

/**
 * Triggers the installer download and resolves only when the file has
 * effectively landed (or the best approximation we have for the platform).
 *
 * Per-OS strategy:
 *  - **Windows**: stream via fetch + Blob so the "Downloading..." UI stays
 *    in sync with the actual transfer. Safe because attribution is baked
 *    into the NSIS-wrapped EXE bytes (the wrapper writes
 *    campaign-anon-user-id.txt during install) — a blob: URL changing the
 *    Zone.Identifier doesn't affect the launcher's UUID recovery.
 *  - **macOS**: native `<a>.click()` (the launcher reads `anon_user_id`
 *    from the DMG's `kMDItemWhereFroms` xattr and a blob: URL would replace
 *    it with the page's blob origin) plus an adaptive hold based on
 *    `Content-Length` from a HEAD request and `navigator.connection.downlink`.
 *
 * If the streamed fetch fails on Windows (CORS not configured for the
 * current origin — true on Vercel preview deploys, where the gateway only
 * allows known prod/staging hosts), fall back to the native anchor + a
 * fixed hold so the download still happens.
 */
const streamOrFallback = async ({ url, filename, os, signal, onProgress }: StreamOrFallbackArgs): Promise<void> => {
  if (os === OperativeSystem.MACOS) {
    const startedAt = Date.now()
    triggerFileDownload(url, filename)
    const holdMs = await estimateDownloadHoldMs(url, signal)
    if (signal.aborted) return
    const remaining = Math.max(0, holdMs - (Date.now() - startedAt))
    await sleep(remaining, signal)
    return
  }

  try {
    await downloadFileWithProgress(
      url,
      filename,
      ({ loaded, total }) => {
        if (signal.aborted || total <= 0) return
        // Cap at 99 so the UI shows "Downloading..." while we hand the blob
        // off to the anchor click; the caller flips to 100 once the click
        // has dispatched and the page transitions to the steps view.
        onProgress(Math.min(99, Math.floor((loaded / total) * 100)))
      },
      signal
    )
  } catch (error) {
    if (signal.aborted) throw error
    console.warn('Streamed download failed, falling back to native anchor', {
      name: error instanceof Error ? error.name : 'unknown'
    })
    triggerFileDownload(url, filename)
    await sleep(FALLBACK_LOADER_HOLD_MS, signal)
  }
}

export { ESTIMATE_MAX_HOLD_MS, ESTIMATE_MIN_HOLD_MS, FALLBACK_LOADER_HOLD_MS, estimateDownloadHoldMs, streamOrFallback }
