import type { DownloadProgressCallback } from './file.types'

const clickAnchor = (href: string, downloadAttr: string | null): void => {
  const a = document.createElement('a')
  a.href = href
  if (downloadAttr !== null) {
    a.setAttribute('download', downloadAttr)
  }
  document.body.appendChild(a)
  a.click()
  // Defer removal so the browser has dispatched the navigation/download.
  // Synchronously removing the anchor right after `click()` aborts the
  // download in some Chromium versions.
  requestAnimationFrame(() => a.remove())
}

const triggerFileDownload = (link: string, filename = ''): void => {
  // Chromium ignores the `download` attribute on cross-origin URLs unless
  // the response sets Content-Disposition. Setting it on a cross-origin URL
  // without that header has historically dropped the download silently for
  // some `.dmg` responses. Only attach the attribute when we're same-origin.
  let downloadAttr: string | null = null
  try {
    const url = new URL(link, window.location.href)
    if (url.origin === window.location.origin) {
      downloadAttr = filename || ''
    }
  } catch {
    // Invalid URL: fall through and let the browser handle it.
  }
  clickAnchor(link, downloadAttr)
}

const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const blobUrl = URL.createObjectURL(blob)
  clickAnchor(blobUrl, filename)
  // The browser takes its own internal reference to the blob once the click
  // dispatches the download, so revoking on the next frame frees memory
  // without aborting the save.
  requestAnimationFrame(() => URL.revokeObjectURL(blobUrl))
}

/**
 * Streams a download via fetch + ReadableStream so the caller has a real
 * progress signal (loaded/total per chunk) instead of the synchronous
 * `<a>.click()`, which returns immediately while the browser keeps fetching
 * in the background.
 *
 * The assembled bytes go to disk via a `blob:` URL. This intentionally
 * bypasses the browser's native download manager — useful when we want to
 * keep a "Downloading..." UI in sync with the actual transfer, but it
 * changes how the OS records the file's origin (see callers for the
 * platform-specific implications: Windows-NSIS bakes attribution into the
 * binary so this is safe; macOS-DMG depends on the kMDItemWhereFroms xattr
 * which a blob URL would corrupt).
 *
 * Throws on fetch error / non-2xx so the caller can fall back to the
 * native anchor path.
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

  const contentLengthHeader = response.headers.get('content-length')
  const total = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0
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

export { downloadFileWithProgress, triggerFileDownload }
