import { useCallback, useEffect, useRef, useState } from 'react'

const COPIED_RESET_MS = 2000

interface UseCopyShareLinkResult {
  copied: boolean
  handleCopy: () => void
}

function useCopyShareLink(url: string): UseCopyShareLinkResult {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Every caller lives inside a modal that can close well within the two
  // seconds, and the reset would then land on an unmounted tree.
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    []
  )

  const handleCopy = useCallback(() => {
    navigator.clipboard
      ?.writeText(url)
      ?.then(() => {
        setCopied(true)
        if (resetTimer.current) clearTimeout(resetTimer.current)
        resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS)
      })
      .catch(err => console.warn('[useCopyShareLink] Failed to copy:', err))
  }, [url])

  return { copied, handleCopy }
}

export { useCopyShareLink }
export type { UseCopyShareLinkResult }
