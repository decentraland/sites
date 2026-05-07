import { OperativeSystem } from '../types/download.types'
import { downloadFileWithProgress, triggerFileDownload } from './file'
import type { StreamOrFallbackArgs } from './streamOrFallback.types'

// Hold time when we can't observe the actual transfer — used on macOS (where
// the native anchor is mandatory to preserve the kMDItemWhereFroms xattr the
// launcher reads) and as the fetch-error fallback on Windows. The gateway's
// per-request NSIS+sign step on Windows typically dominates and can run 5-30s,
// so this is a coarse approximation rather than a real progress signal.
const FALLBACK_LOADER_HOLD_MS = 4000

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

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
 *  - **macOS**: native `<a>.click()` only. The launcher reads
 *    `anon_user_id` from the DMG's `kMDItemWhereFroms` xattr that the OS
 *    writes from the original download URL; a blob: URL would replace it
 *    with the page's blob origin and break attribution. We fall back to a
 *    fixed-duration backdrop hold instead.
 *
 * If the streamed fetch fails on Windows (CORS not configured for the
 * current origin — true on Vercel preview deploys, where the gateway only
 * allows known prod/staging hosts), fall back to the native anchor + hold
 * so the download still happens.
 */
const streamOrFallback = async ({ url, filename, os, signal, onProgress }: StreamOrFallbackArgs): Promise<void> => {
  if (os === OperativeSystem.MACOS) {
    triggerFileDownload(url, filename)
    await sleep(FALLBACK_LOADER_HOLD_MS)
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
    await sleep(FALLBACK_LOADER_HOLD_MS)
  }
}

export { FALLBACK_LOADER_HOLD_MS, streamOrFallback }
