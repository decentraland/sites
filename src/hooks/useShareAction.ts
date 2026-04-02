import { useCallback } from 'react'

function useShareAction() {
  return useCallback(async () => {
    const shareData = {
      title: 'Decentraland',
      text: 'Download Decentraland',
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled sharing or share failed — silently ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
      } catch {
        // Clipboard API unavailable — silently ignore
      }
    }
  }, [])
}

export { useShareAction }
