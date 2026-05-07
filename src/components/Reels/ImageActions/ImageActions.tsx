import { memo, useCallback, useState } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { buildTwitterShareUrl } from '../../../features/media/reels'
import type { Image } from '../../../features/media/reels'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import downloadIcon from '../../../images/reels/download-icon.svg'
import infoIcon from '../../../images/reels/info-icon.svg'
import linkIcon from '../../../images/reels/link-icon.svg'
import { SegmentEvent } from '../../../modules/segment'
import {
  ActionIcon,
  ActionsContainer,
  CopyLinkBadge,
  CopyLinkWrapper,
  InfoButton,
  InfoIcon,
  ShareButton,
  ShareIcon,
  Spacer
} from './ImageActions.styled'

const COPY_BADGE_TIMEOUT_MS = 2000

interface ImageActionsProps {
  image: Image
  metadataVisible: boolean
  onToggleMetadata: () => void
}

const ImageActions = memo(({ image, metadataVisible, onToggleMetadata }: ImageActionsProps) => {
  const l = useFormatMessage()
  const { track } = useAnalytics()
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(() => {
    const shareUrl = buildTwitterShareUrl(l('component.reels.image_actions.share_text'), window.location.href)
    track(SegmentEvent.REELS_SHARE, { imageId: image.id })
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }, [image.id, l, track])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), COPY_BADGE_TIMEOUT_MS)
      track(SegmentEvent.REELS_COPY_LINK, { imageId: image.id })
    } catch (error) {
      console.warn('[Reels] copy link failed', error)
    }
  }, [image.id, track])

  const handleDownload = useCallback(async () => {
    try {
      track(SegmentEvent.REELS_DOWNLOAD, { imageId: image.id })
      const response = await fetch(image.url)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const userName = image.metadata.visiblePeople[0]?.userName ?? 'photo'
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `${userName}-${image.metadata.dateTime}.jpg`
      anchor.click()
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      console.warn('[Reels] download failed', error)
    }
  }, [image, track])

  const handleInfoToggle = useCallback(() => {
    track(metadataVisible ? SegmentEvent.REELS_HIDE_METADATA : SegmentEvent.REELS_SHOW_METADATA, {
      imageId: image.id
    })
    onToggleMetadata()
  }, [image.id, metadataVisible, onToggleMetadata, track])

  return (
    <ActionsContainer>
      <ShareButton
        type="button"
        aria-label={l('component.reels.image_actions.share')}
        onClick={handleShare}
        onKeyDown={event => event.key === 'Enter' && handleShare()}
      >
        <ShareIcon />
      </ShareButton>
      <CopyLinkWrapper>
        <ActionIcon
          src={linkIcon}
          alt={l('component.reels.image_actions.copy_link')}
          role="button"
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={event => event.key === 'Enter' && handleCopy()}
        />
        <CopyLinkBadge visible={copied}>{l('component.reels.image_actions.copied')}</CopyLinkBadge>
      </CopyLinkWrapper>
      <ActionIcon
        src={downloadIcon}
        alt={l('component.reels.image_actions.download')}
        role="button"
        tabIndex={0}
        onClick={handleDownload}
        onKeyDown={event => event.key === 'Enter' && handleDownload()}
      />
      <Spacer />
      <InfoButton
        metadataVisible={metadataVisible}
        role="button"
        tabIndex={0}
        onClick={handleInfoToggle}
        onKeyDown={event => event.key === 'Enter' && handleInfoToggle()}
      >
        <InfoIcon src={infoIcon} alt={l('component.reels.image_actions.info')} />
      </InfoButton>
    </ActionsContainer>
  )
})

export { ImageActions }
