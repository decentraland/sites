import { useCallback, useState } from 'react'
import { useAsyncMemo } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import type { DownloadModalProps } from 'decentraland-ui2'
import { DOWNLOAD_URLS, detectDownloadOS } from '../modules/downloadConstants'
import { buildDownloadTrackingParams } from '../modules/downloadTrackingParams'
import { ExplorerDownloads } from '../modules/explorerDownloads'
import { formatToShorthand } from '../modules/number'
import { buildTrackedDownloadUrl } from '../modules/url'
import { useAnonUserId } from './useAnonUserId'
import { useWalletAddress } from './useWalletAddress'

let cachedCount: string | null = null

/**
 * Hook that implements the "Hang Out Now" / "Jump In" button flow:
 * - Not signed in → open DownloadModal directly
 * - Signed in, has launcher → open the game
 * - Signed in, no launcher → open DownloadModal
 */
function useHangOutAction() {
  const { isConnected } = useWalletAddress()
  const anonUserId = useAnonUserId()
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

  const [rawDownloads, status] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])
  if (!status.loading && status.loaded && rawDownloads) cachedCount = formatToShorthand(rawDownloads)
  const totalDownloads = cachedCount ?? '+400K'

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()

      if (!isConnected) {
        setIsDownloadModalOpen(true)
        return
      }

      try {
        const hasLauncher = await launchDesktopApp()
        if (!hasLauncher) {
          setIsDownloadModalOpen(true)
        }
      } catch {
        setIsDownloadModalOpen(true)
      }
    },
    [isConnected]
  )

  const closeDownloadModal = useCallback(() => setIsDownloadModalOpen(false), [])

  const os = detectDownloadOS()

  // Carry the tracking params (campaign utm_* + anon_user_id) onto the modal's
  // primary CTA so attribution survives the hop to `/download` and the funnel
  // join stays intact — same contract as the download-page CTAs.
  const downloadUrlParams = buildDownloadTrackingParams(anonUserId)
  const downloadModalProps: Omit<DownloadModalProps, 'open' | 'onClose'> = {
    os,
    downloadUrl: buildTrackedDownloadUrl(os === 'apple' ? DOWNLOAD_URLS.apple : DOWNLOAD_URLS.windows, downloadUrlParams),
    epicUrl: DOWNLOAD_URLS.epic,
    googlePlayUrl: DOWNLOAD_URLS.googlePlay,
    appStoreUrl: DOWNLOAD_URLS.appStore,
    i18n: { totalDownloads: `Total Downloads: ${totalDownloads}` }
  }

  return { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps, totalDownloads }
}

export { useHangOutAction }
