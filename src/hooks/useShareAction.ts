import { useCallback } from 'react'

type ShareResult = 'shared' | 'copied' | 'failed'

function useShareAction(): () => Promise<ShareResult> {
  return useCallback(async () => {
    const shareData = {
      title: 'Decentraland',
      text: 'Download Decentraland',
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return 'shared'
      } catch {
        return 'failed'
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      return 'copied'
    } catch {
      return 'failed'
    }
  }, [])
}

export { useShareAction }
export type { ShareResult }
