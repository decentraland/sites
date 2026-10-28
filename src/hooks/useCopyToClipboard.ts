import { useCallback, useEffect, useRef, useState } from 'react'

const COPIED_RESET_MS = 2000

interface UseCopyToClipboardResult {
  copied: boolean
  copy: (text: string) => void
}

/**
 * Copy-to-clipboard with transient "copied" feedback. `copied` stays true for
 * `resetMs` after a successful copy; the reset timer is cleared on the next copy
 * and on unmount. Clipboard rejections (denied permission / insecure context) are
 * swallowed so they never surface as unhandled promise rejections.
 *
 * Sibling `useCopyShareLink` binds a URL at hook-call time; this primitive takes
 * the text at copy-call time, which suits handlers that compute the value on click.
 */
function useCopyToClipboard(resetMs: number = COPIED_RESET_MS): UseCopyToClipboardResult {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const copy = useCallback(
    (text: string) => {
      if (typeof navigator === 'undefined' || !navigator.clipboard) return
      void navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true)
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => setCopied(false), resetMs)
        })
        .catch(() => {
          /* clipboard write can reject on denied permission / insecure context — no feedback to surface */
        })
    },
    [resetMs]
  )

  return { copied, copy }
}

export { useCopyToClipboard }
export type { UseCopyToClipboardResult }
