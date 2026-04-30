import { useCallback, useState } from 'react'

const COPIED_RESET_MS = 2000

interface UseCopyShareLinkResult {
  copied: boolean
  handleCopy: () => void
}

function useCopyShareLink(url: string): UseCopyShareLinkResult {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard
      ?.writeText(url)
      ?.then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), COPIED_RESET_MS)
      })
      .catch(err => console.warn('[useCopyShareLink] Failed to copy:', err))
  }, [url])

  return { copied, handleCopy }
}

export { useCopyShareLink }
export type { UseCopyShareLinkResult }
