type DownloadProgress = { loaded: number; total: number }
type DownloadProgressCallback = (progress: DownloadProgress) => void

const triggerFileDownload = (link: string, filename = ''): void => {
  const a = document.createElement('a')
  a.href = link

  // The `download` attribute is only honored on same-origin URLs (and on
  // cross-origin URLs whose response includes Content-Disposition). Setting it
  // on a cross-origin URL without that header silently drops the download on
  // macOS .dmg files served straight from the LAUNCHER CDN, even though
  // Windows .exe still downloads thanks to special-case browser handling.
  try {
    const url = new URL(link, window.location.href)
    if (url.origin === window.location.origin && filename) {
      a.setAttribute('download', filename)
    } else if (url.origin === window.location.origin) {
      a.setAttribute('download', '')
    }
  } catch {
    // invalid URL — skip the attribute and let the browser navigate
  }

  document.body.appendChild(a)
  a.click()
  // Defer removal so the navigation/download has been queued by the browser.
  requestAnimationFrame(() => {
    a.remove()
  })
}

const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const blobUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = blobUrl
    a.setAttribute('download', filename)
    document.body.appendChild(a)
    a.click()
    requestAnimationFrame(() => {
      a.remove()
    })
  } finally {
    // Revoke after the click is dispatched. The browser has already started
    // saving the file by then; revoking earlier would race the download.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
  }
}

/**
 * Downloads a file via fetch + streaming so the caller can show a loader from
 * the click until the gateway has actually produced the file. The previous
 * `<a>.click()` flow returned synchronously and hid the loader before the
 * gateway had even started responding — on Windows the gateway can take
 * several seconds to wrap the installer with the campaign id, leaving the
 * user staring at the steps page with no feedback.
 *
 * Throws on network or HTTP errors so the caller can fall back to a native
 * `triggerFileDownload` (which still works when CORS isn't configured but
 * loses the progress UX).
 */
async function downloadFileWithProgress(
  url: string,
  filename: string,
  onProgress?: DownloadProgressCallback,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'follow',
    signal
  })

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`)
  }
  if (!response.body) {
    throw new Error('Response body is null')
  }

  const contentLength = response.headers.get('content-length')
  const total = contentLength ? parseInt(contentLength, 10) : 0
  const reader = response.body.getReader()
  const chunks: BlobPart[] = []
  let loaded = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      chunks.push(value)
      loaded += value.length
      onProgress?.({ loaded, total })
    }
  } catch (error) {
    // Cancel the underlying connection so the browser doesn't keep buffering
    // a fetch we have already abandoned.
    try {
      await reader.cancel()
    } catch {
      // ignore
    }
    throw error
  }

  const blob = new Blob(chunks)
  triggerBlobDownload(blob, filename)
}

export { triggerFileDownload, downloadFileWithProgress }
export type { DownloadProgress, DownloadProgressCallback }
