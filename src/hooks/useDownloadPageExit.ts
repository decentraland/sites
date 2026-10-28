import { useEffect, useRef } from 'react'
import { resetDownloadCtaClicked, sendDownloadPageExit } from '../modules/downloadPageExit'
import { subscribeVisibility } from '../utils/documentVisibility'

/**
 * Subscribes /download to the abandonment diagnostic. Resets the CTA flag on
 * mount (a download click made on another page shouldn't count as a choice
 * made on this one) and fires the snapshot on every visibilitychange → hidden.
 */
function useDownloadPageExit(): void {
  const pageLoadedAtRef = useRef(Date.now())

  useEffect(() => {
    resetDownloadCtaClicked()
    return subscribeVisibility(visible => {
      if (!visible) sendDownloadPageExit(Date.now() - pageLoadedAtRef.current)
    })
  }, [])
}

export { useDownloadPageExit }
