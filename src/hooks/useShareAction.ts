import { useCallback } from 'react'

type ShareResult = 'shared' | 'copied' | 'failed'

interface ShareActionData {
  url: string
  title?: string
  text?: string
}

/**
 * Hands a link to the OS share sheet where the browser has one, and copies it to
 * the clipboard where it does not. The result says which happened, so a caller
 * can show the "Copied" confirmation only on the branch that needs one: the
 * native sheet is its own feedback.
 *
 * A rejected `navigator.share` is the user dismissing the sheet, so it resolves
 * `failed` rather than falling through to the clipboard. Copying behind their
 * back would leave a link they never asked for.
 */
function useShareAction(): (data: ShareActionData) => Promise<ShareResult> {
  return useCallback(async ({ url, title, text }: ShareActionData) => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url })
        return 'shared'
      } catch {
        return 'failed'
      }
    }

    try {
      await navigator.clipboard?.writeText(url)
      return 'copied'
    } catch {
      return 'failed'
    }
  }, [])
}

export { useShareAction }
export type { ShareActionData, ShareResult }
