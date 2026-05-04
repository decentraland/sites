import type { DownloadProgressCallback } from './file.types'

const clickAnchor = (href: string, downloadValue: string | null): void => {
  const a = document.createElement('a')
  a.href = href
  if (downloadValue !== null) {
    a.setAttribute('download', downloadValue)
  }
  document.body.appendChild(a)
  a.click()
  // Defer removal so the navigation/download has been queued by the browser.
  requestAnimationFrame(() => {
    a.remove()
  })
}

const triggerFileDownload = (link: string, filename = ''): void => {
  // The `download` attribute is only honored on same-origin URLs (and on
  // cross-origin URLs whose response includes Content-Disposition). Setting it
  // on a cross-origin URL without that header silently drops the download on
  // macOS .dmg files served straight from the LAUNCHER CDN, even though
  // Windows .exe still downloads thanks to special-case browser handling.
  let downloadValue: string | null = null
  try {
    const url = new URL(link, window.location.href)
    if (url.origin === window.location.origin) {
      downloadValue = filename || ''
    }
  } catch {
    // invalid URL — skip the attribute and let the browser navigate
  }
  clickAnchor(link, downloadValue)
}

const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const blobUrl = URL.createObjectURL(blob)
  clickAnchor(blobUrl, filename)
  // The browser takes its own internal reference to the blob once the click
  // dispatches the download, so revoking on the next frame frees the URL
  // without aborting the save. Aligned with the rAF anchor removal above.
  requestAnimationFrame(() => URL.revokeObjectURL(blobUrl))
}

/**
 * Downloads a file via fetch + streaming so the caller can show a loader from
 * the click until the gateway has actually produced the file. The previous
 * `<a>.click()` flow returned synchronously and hid the loader before the
 * gateway had even started responding — on Windows the gateway can take
 * several seconds to wrap the installer with the campaign id, leaving the
 * user staring at the steps page with no feedback.
 *
 * Memory: the response is piped through a `TransformStream` so progress can
 * be reported per chunk without buffering the whole installer in JS heap.
 * `new Response(stream).blob()` lets the browser manage the assembled bytes
 * natively, which keeps peak memory bounded on low-RAM Windows laptops.
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
  let loaded = 0

  const progressStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      loaded += chunk.byteLength
      onProgress?.({ loaded, total })
      controller.enqueue(chunk)
    }
  })

  const blob = await new Response(response.body.pipeThrough(progressStream)).blob()
  triggerBlobDownload(blob, filename)
}

export { triggerFileDownload, downloadFileWithProgress }
