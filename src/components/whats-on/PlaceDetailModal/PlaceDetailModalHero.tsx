import { useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTranslation } from '@dcl/hooks'
import { Tooltip, useTheme } from 'decentraland-ui2'
import { useCreatorProfile } from '../../../hooks/useCreatorProfile'
import { formatEthAddress } from '../../../utils/avatar'
import { getCreatorColor } from '../../../utils/creatorColor'
import { buildPlaceShareUrl } from '../../../utils/whatsOnUrl'
import { JumpInButton } from '../../jump/JumpInButton'
import {
  ActionsRow,
  AvatarFallback,
  AvatarImage,
  CloseButton,
  CloseIconStyled,
  CopyButton,
  CopyIconStyled,
  CreatorName,
  CreatorNameHighlight,
  CreatorRow,
  HeroContent,
  HeroImage,
  HeroOverlay,
  HeroSection,
  ModalTitle
} from '../EventDetailModal/EventDetailModal.styled'
import type { ModalPlaceData } from './PlaceDetailModal.types'

function PlaceDetailModalHero({ data, onClose }: { data: ModalPlaceData; onClose: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [copied, setCopied] = useState(false)

  const ownerFallback = data.ownerAddress ? formatEthAddress(data.ownerAddress) : undefined
  const { creatorName, avatarFace } = useCreatorProfile(data.ownerAddress, data.ownerName, ownerFallback)
  const hasOwner = Boolean(avatarFace || creatorName)
  const fallbackColor = getCreatorColor(data.ownerAddress)

  const [x, y] = data.coordinates
  const realm = data.worldName ?? undefined

  const handleCopy = useCallback(() => {
    const shareUrl = buildPlaceShareUrl({ position: data.isWorld ? null : `${x},${y}`, world: data.worldName })
    navigator.clipboard
      ?.writeText(shareUrl)
      ?.then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(err => console.warn('[PlaceDetailModal] Failed to copy:', err))
  }, [data.isWorld, data.worldName, x, y])

  return (
    <HeroSection>
      {data.image && <HeroImage src={data.image} alt={data.title} />}
      <HeroOverlay />
      <CloseButton onClick={onClose} aria-label={t('place_detail.close')}>
        {isMobile ? <ArrowBackIosNewIcon sx={{ fontSize: 20, color: '#FCFCFC' }} /> : <CloseIconStyled />}
      </CloseButton>
      <HeroContent>
        <ModalTitle id="place-detail-title">{data.title}</ModalTitle>
        {hasOwner && (
          <CreatorRow>
            {avatarFace ? (
              <AvatarImage src={avatarFace} alt={creatorName ?? ''} fallbackColor={fallbackColor} />
            ) : (
              <AvatarFallback fallbackColor={fallbackColor} />
            )}
            <CreatorName>
              {t('place_detail.by_prefix')}
              <CreatorNameHighlight>{creatorName ?? t('place_detail.unknown_owner')}</CreatorNameHighlight>
            </CreatorName>
          </CreatorRow>
        )}
        <ActionsRow>
          <JumpInButton position={`${x},${y}`} realm={realm} size="medium">
            {t('place_detail.jump_in')}
          </JumpInButton>
          <Tooltip title={copied ? t('place_detail.copied') : t('place_detail.copy_link')} placement="top" arrow>
            <CopyButton onClick={handleCopy} aria-label={t('place_detail.copy_link')}>
              <CopyIconStyled />
            </CopyButton>
          </Tooltip>
        </ActionsRow>
      </HeroContent>
    </HeroSection>
  )
}

export { PlaceDetailModalHero }
