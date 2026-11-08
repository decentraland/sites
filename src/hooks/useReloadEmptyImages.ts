import { useEffect } from 'react'
import type { RefObject } from 'react'

const RETRY_INTERVAL_MS = 500
const MAX_RETRIES = 5

// A load that the browser cancelled leaves the image complete but empty, with no load or error event: nothing in
// the page can react to it, so the images are inspected instead.
const isEmpty = (image: HTMLImageElement): boolean => image.complete && image.naturalWidth === 0 && Boolean(image.getAttribute('src'))

const requestAgain = (image: HTMLImageElement): void => {
  const src = image.getAttribute('src') as string
  image.removeAttribute('src')
  image.setAttribute('src', src)
}

/**
 * Requests again the images under `rootRef` that were cancelled by the browser (Firefox cancels the in-flight image
 * requests of a page when it starts a file download), checking every half second, at most five times.
 * Does nothing while `enabled` is false, so it can wait for the navigation that cancels them to be over.
 */
function useReloadEmptyImages(rootRef: RefObject<HTMLElement>, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    let retries = 0
    const timer = setInterval(() => {
      const empty = [...(rootRef.current?.querySelectorAll('img') ?? [])].filter(isEmpty)
      empty.forEach(requestAgain)
      retries += 1
      if (empty.length === 0 || retries >= MAX_RETRIES) clearInterval(timer)
    }, RETRY_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [rootRef, enabled])
}

export { useReloadEmptyImages }
