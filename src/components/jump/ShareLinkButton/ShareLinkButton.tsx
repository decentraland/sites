import { type FC, useCallback } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ShareIcon from '@mui/icons-material/Share'
import { Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ShareLinkContainer, StyledShareButton } from './ShareLinkButton.styled'

interface ShareLinkButtonProps {
  url?: string
  title?: string
}

const ShareLinkButton: FC<ShareLinkButtonProps> = ({ url, title }) => {
  const formatMessage = useFormatMessage()

  const handleShare = useCallback(async () => {
    const shareUrl = url || window.location.href
    const shareTitle = title || document.title

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl })
        return
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch (error) {
      console.error('Failed to copy share link to clipboard', error)
    }
  }, [url, title])

  return (
    <ShareLinkContainer>
      <Typography variant="h6" align="center" mb="8px">
        {formatMessage('component.jump.share.switch_to_computer')}
      </Typography>
      <StyledShareButton variant="contained" onClick={handleShare} startIcon={<ShareIcon />} fullWidth>
        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 16 }}>
          {formatMessage('component.jump.share.button_text')}
        </Typography>
      </StyledShareButton>
    </ShareLinkContainer>
  )
}

export { ShareLinkButton }
