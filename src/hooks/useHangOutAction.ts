import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsyncMemo } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import type { DownloadModalProps } from 'decentraland-ui2'
import { resolveExplorerEnv } from '../config/dclenv'
import { DOWNLOAD_URLS, detectDownloadOS } from '../modules/downloadConstants'
import { ExplorerDownloads } from '../modules/explorerDownloads'
import { formatToShorthand } from '../modules/number'
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
  const [searchParams] = useSearchParams()
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

  const [rawDownloads, status] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])
  if (!status.loading && status.loaded && rawDownloads) cachedCount = formatToShorthand(rawDownloads)
  const totalDownloads = cachedCount ?? '+400K'

  const explorerEnv = useMemo(() => resolveExplorerEnv(searchParams), [searchParams])

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()

      if (!isConnected) {
        setIsDownloadModalOpen(true)
        return
      }

      try {
        const hasLauncher = await launchDesktopApp({ dclenv: explorerEnv })
        if (!hasLauncher) {
          setIsDownloadModalOpen(true)
        }
      } catch {
        setIsDownloadModalOpen(true)
      }
    },
    [isConnected, explorerEnv]
  )

  const closeDownloadModal = useCallback(() => setIsDownloadModalOpen(false), [])

  const os = detectDownloadOS()

  const downloadModalProps: Omit<DownloadModalProps, 'open' | 'onClose'> = {
    os,
    downloadUrl: os === 'apple' ? DOWNLOAD_URLS.apple : DOWNLOAD_URLS.windows,
    epicUrl: DOWNLOAD_URLS.epic,
    googlePlayUrl: DOWNLOAD_URLS.googlePlay,
    appStoreUrl: DOWNLOAD_URLS.appStore,
    i18n: { totalDownloads: `Total Downloads: ${totalDownloads}` }
  }

  return { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps, totalDownloads }
}

export { useHangOutAction }
