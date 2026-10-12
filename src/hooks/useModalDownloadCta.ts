import { useCallback } from 'react'
import { detectDesktopInstallerOs } from '../modules/downloadConstants'
import { DownloadPlace, DownloadTarget, SegmentEvent } from '../modules/segment'
import { buildModalDownloadUrl } from '../modules/url'
import { useDownloadClick } from './useDownloadClick'

/**
 * Primary CTA of the "install first" DownloadModal. With a desktop installer for
 * this browser it starts the download directly: the click is tracked like any
 * hero download (Click with place + download_target + click_id correlation) and
 * the page navigates in the same tab, because ui2 opens the button with
 * `noopener` and a noopener tab starts with an empty sessionStorage, which would
 * drop the click_id `/download_success` joins on. Without an installer the CTA
 * keeps opening `fallbackBase` (the `/download` chooser, which tracks its own click).
 */
function useModalDownloadCta(fallbackBase: string, params: Record<string, string | undefined | null>) {
  const trackDownloadClick = useDownloadClick()
  const installerOs = detectDesktopInstallerOs()
  const downloadUrl = buildModalDownloadUrl(installerOs, fallbackBase, params)

  const handleDirectDownloadClick = useCallback(
    // Optional only because ui2 types the prop as `() => void`; it wires it
    // straight to the button's onClick, so the click event is always passed.
    (event?: React.MouseEvent<HTMLElement>) => {
      if (!installerOs || !event) return
      // Let the browser handle new-tab, new-window and download-link (Alt) clicks instead of replacing the current page.
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
      // ui2's DownloadModal does not forward data-* props to its button, so the
      // attributes the click payload reads are set on it here.
      const button = event.currentTarget
      button.dataset.event = SegmentEvent.DOWNLOAD
      button.dataset.place = DownloadPlace.DOWNLOAD_MODAL
      button.dataset.downloadTarget = DownloadTarget.DESKTOP_INSTALLER
      button.dataset.os = installerOs
      trackDownloadClick(event)
      event.preventDefault()
      window.location.assign(downloadUrl)
    },
    [installerOs, downloadUrl, trackDownloadClick]
  )

  return { downloadUrl, onDownloadClick: installerOs ? handleDirectDownloadClick : undefined }
}

export { useModalDownloadCta }
