import { useCallback, useState } from 'react'
import { useWalletState } from '@dcl/core-web3/lazy'
import { launchDesktopApp } from 'decentraland-ui2'
import type { DownloadModalProps } from 'decentraland-ui2'
import { getEnv } from '../config/env'
import { redirectToAuth } from '../utils/authRedirect'

const DOWNLOAD_MODAL_PROPS = {
  title: 'Download Decentraland',
  description: 'Get the desktop app to explore Decentraland.',
  buttonLabel: 'Download'
} as const

/**
 * Hook that implements the "Hang Out Now" button flow:
 * - Not signed in → redirect to auth/sign-in page
 * - Signed in, no launcher → open download modal
 * - Signed in, has launcher → open the game directly
 */
function useHangOutAction() {
  const { isConnected } = useWalletState()
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)
  const downloadUrl = getEnv('DOWNLOAD_URL') ?? 'https://decentraland.org/download'

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()

      if (!isConnected) {
        redirectToAuth(window.location.pathname)
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

  const handleDownloadClick = useCallback(() => {
    window.open(downloadUrl, '_blank')
    setIsDownloadModalOpen(false)
  }, [downloadUrl])

  const downloadModalProps: Omit<DownloadModalProps, 'open' | 'onClose'> = {
    ...DOWNLOAD_MODAL_PROPS,
    onDownloadClick: handleDownloadClick
  }

  return { handleClick, isDownloadModalOpen, closeDownloadModal, downloadModalProps }
}

export { useHangOutAction }
