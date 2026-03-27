import { useCallback, useState } from 'react'
import { useWallet } from '@dcl/core-web3'
import { launchDesktopApp } from 'decentraland-ui2'
import { redirectToAuth } from '../utils/authRedirect'

/**
 * Hook that implements the "Hang Out Now" button flow:
 * - Not signed in → redirect to auth/sign-in page
 * - Signed in, no launcher → open download modal
 * - Signed in, has launcher → open the game directly
 */
function useHangOutAction() {
  const { isConnected } = useWallet()
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()

      if (!isConnected) {
        redirectToAuth(window.location.pathname)
        return
      }

      const hasLauncher = await launchDesktopApp()
      if (!hasLauncher) {
        setIsDownloadModalOpen(true)
      }
    },
    [isConnected]
  )

  const closeDownloadModal = useCallback(() => setIsDownloadModalOpen(false), [])

  return { handleClick, isDownloadModalOpen, closeDownloadModal, isConnected }
}

export { useHangOutAction }
