import { useCallback } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useCopyShareLink } from '../../../hooks/useCopyShareLink'
import { useShareUrl } from '../../../hooks/useShareUrl'
import { CopyGlyph } from './CardIcons'
import { CopiedBubble, ShareCta } from './SharePlaceButton.styled'

interface SharePlaceButtonProps {
  // Path or URL of the thing being shared. The sharer's wallet is appended to it.
  target: string
  // Used as the title of the native share sheet, where one exists.
  title?: string
}

// Share control for a place. Hands off to the OS share sheet when the browser
// has one (every mobile browser does), and falls back to the clipboard with a
// transient confirmation, which is all a desktop browser can offer.
function SharePlaceButton({ target, title }: SharePlaceButtonProps) {
  const t = useFormatMessage()
  const shareUrl = useShareUrl(target)
  const { copied, handleCopy } = useCopyShareLink(shareUrl)

  const handleShare = useCallback(() => {
    // A rejected share is the user dismissing the sheet, so there is nothing to
    // recover from and nothing to fall back to: copying behind their back would
    // put a link on the clipboard they never asked for.
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      navigator.share({ title, url: shareUrl }).catch(() => undefined)
      return
    }
    handleCopy()
  }, [handleCopy, shareUrl, title])

  return (
    <ShareCta type="button" aria-label={t('discover.scene.share')} onClick={handleShare}>
      <CopyGlyph size="clamp(16px, 1.042vw, 20px)" />
      {copied && <CopiedBubble role="status">{t('discover.scene.copied')}</CopiedBubble>}
    </ShareCta>
  )
}

export { SharePlaceButton }
