import { useCallback, useEffect, useRef, useState } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useShareAction } from '../../../hooks/useShareAction'
import { useShareUrl } from '../../../hooks/useShareUrl'
import { ShareGlyph } from './CardIcons'
import { CopiedBubble, ShareCta } from './SharePlaceButton.styled'

const COPIED_RESET_MS = 2000

interface SharePlaceButtonProps {
  // Path or URL of the thing being shared. The sharer's wallet is appended to it.
  target: string
  // Used as the title of the native share sheet, where one exists.
  title?: string
}

// Share control for a place. The OS share sheet is its own confirmation, so the
// "Copied" bubble only appears on the clipboard branch.
function SharePlaceButton({ target, title }: SharePlaceButtonProps) {
  const t = useFormatMessage()
  const shareUrl = useShareUrl(target)
  const share = useShareAction()
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The modal this can sit in closes on jump-in, and the reset would otherwise
  // land on an unmounted tree.
  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
    },
    []
  )

  const handleShare = useCallback(async () => {
    const result = await share({ url: shareUrl, title })
    if (result !== 'copied') return
    setCopied(true)
    if (copiedTimer.current) clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS)
  }, [share, shareUrl, title])

  return (
    <ShareCta type="button" aria-label={t('discover.scene.share')} onClick={handleShare}>
      <ShareGlyph size="clamp(16px, 1.042vw, 20px)" />
      {/* Mounted permanently: a live region inserted together with its text is
          unreliably announced by screen readers. */}
      <CopiedBubble role="status" $visible={copied}>
        {copied ? t('discover.scene.copied') : ''}
      </CopiedBubble>
    </ShareCta>
  )
}

export { SharePlaceButton }
