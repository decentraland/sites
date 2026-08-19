import { useCallback, useState } from 'react'
import { launchDesktopApp } from 'decentraland-ui2'
import type { DownloadModalProps } from 'decentraland-ui2'
import { getEnv } from '../config/env'
import { DOWNLOAD_URLS, detectDownloadOS } from '../modules/downloadConstants'
import { buildDownloadTrackingParams } from '../modules/downloadTrackingParams'
import { buildTrackedDownloadUrl } from '../modules/url'
import { useAnonUserId } from './useAnonUserId'
import { useDeepLinkQueryParams } from './useDeepLinkQueryParams'
import { useTotalDownloads } from './useTotalDownloads'
import { useWalletAddress } from './useWalletAddress'

/**
 * Hook that implements the "Hang Out Now" / "Jump In" button flow:
 * - Not signed in → open DownloadModal directly
 * - Signed in, has launcher → open the game
 * - Signed in, no launcher → open DownloadModal
 */
function useHangOutAction() {
  const { isConnected } = useWalletAddress()
  const { dclenv, sceneConsole, multiInstance } = useDeepLinkQueryParams()
  const anonUserId = useAnonUserId()
  const totalDownloads = useTotalDownloads()
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()

      if (!isConnected) {
        setIsDownloadModalOpen(true)
        return
      }

      try {
        // NOTE: this CTA used to call `launchDesktopApp()` with no options, so it
        // silently dropped every deep-link query param. It now forwards the same
        // ones as the jump surfaces (`?dclenv`/`?scene-console`/`?multi-instance`).
        const hasLauncher = await launchDesktopApp({ dclenv, sceneConsole, multiInstance })
        if (!hasLauncher) {
          setIsDownloadModalOpen(true)
        }
      } catch {
        setIsDownloadModalOpen(true)
      }
    },
    [isConnected, dclenv, sceneConsole, multiInstance]
  )

  const closeDownloadModal = useCallback(() => setIsDownloadModalOpen(false), [])

  const os = detectDownloadOS()

  // Carry the tracking params (campaign utm_* + anon_user_id) onto the modal's
  // primary CTA so attribution survives the hop to `/download` and the funnel
  // join stays intact — same contract as the download-page CTAs.
  const downloadUrlParams = buildDownloadTrackingParams(anonUserId)
  // Prefer the env `DOWNLOAD_URL` (relative on dev/zone → resolved against the
  // current origin) so the download stays on the zone origin; fall back to the
  // platform constant.
  const downloadBase = getEnv('DOWNLOAD_URL') ?? (os === 'apple' ? DOWNLOAD_URLS.apple : DOWNLOAD_URLS.windows)
  const downloadModalProps: Omit<DownloadModalProps, 'open' | 'onClose'> = {
    os,
    downloadUrl: buildTrackedDownloadUrl(downloadBase, downloadUrlParams),
    epicUrl: DOWNLOAD_URLS.epic,
    googlePlayUrl: DOWNLOAD_URLS.googlePlay,
    appStoreUrl: DOWNLOAD_URLS.appStore,
    i18n: { totalDownloads: `Total Downloads: ${totalDownloads}` }
  }

  return { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps, totalDownloads }
}

export { useHangOutAction }
