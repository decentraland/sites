import { downloadFileWithProgress, triggerFileDownload } from './file'
import type { StreamOrFallbackArgs } from './streamOrFallback.types'

// When the streamed fetch path is blocked (e.g. CORS not configured for the
// current origin — true for Vercel preview deploys, where the download
// gateway only allows known prod/staging hosts) we fall back to the native
// `<a>.click()`. That returns synchronously, which would re-introduce the
// "loader vanishes before the download starts" bug. Hold the backdrop up
// for a brief grace period so the user still gets feedback while the gateway
// processes the request.
const FALLBACK_LOADER_HOLD_MS = 4000

const streamOrFallback = async ({ url, filename, signal, onProgress }: StreamOrFallbackArgs): Promise<void> => {
  try {
    await downloadFileWithProgress(
      url,
      filename,
      ({ loaded, total }) => {
        if (signal.aborted || total <= 0) return
        onProgress(Math.min(99, Math.floor((loaded / total) * 100)))
      },
      signal
    )
  } catch (error) {
    if (signal.aborted) throw error
    console.warn('Streamed download failed, falling back to native anchor', { name: error instanceof Error ? error.name : 'unknown' })
    triggerFileDownload(url, filename)
    await new Promise(resolve => setTimeout(resolve, FALLBACK_LOADER_HOLD_MS))
  }
}

export { FALLBACK_LOADER_HOLD_MS, streamOrFallback }
