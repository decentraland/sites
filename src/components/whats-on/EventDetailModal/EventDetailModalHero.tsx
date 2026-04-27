import { useCallback, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EditIcon from '@mui/icons-material/Edit'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTranslation } from '@dcl/hooks'
import { LiveBadge, Tooltip, useTheme } from 'decentraland-ui2'
import { useCanEditEvent } from '../../../hooks/useCanEditEvent'
import { useCreatorProfile } from '../../../hooks/useCreatorProfile'
import { useRemindMe } from '../../../hooks/useRemindMe'
import { formatEthAddress } from '../../../utils/avatar'
import { buildCalendarUrl, buildEventShareUrl } from '../../../utils/whatsOnUrl'
import { JumpInButton } from '../../jump/JumpInButton'
import { RemindMeIcon } from '../common/RemindMeIcon'
import type { ModalEventData } from './EventDetailModal.types'
import {
  ActionsRow,
  AvatarFallback,
  AvatarImage,
  CategoryLabel,
  CloseButton,
  CloseIconStyled,
  CopyButton,
  CopyIconStyled,
  CreatorName,
  CreatorNameHighlight,
  CreatorRow,
  EditButton,
  HeroContent,
  HeroImage,
  HeroOverlay,
  HeroSection,
  LiveBadgeWrapper,
  ModalTitle,
  SecondaryButton
} from './EventDetailModal.styled'

function EventDetailModalHero({ data, onClose, onEdit }: { data: ModalEventData; onClose: () => void; onEdit?: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [copied, setCopied] = useState(false)
  const { isReminded, isLoading: isRemindLoading, isShaking, handleToggle: handleRemindToggle } = useRemindMe(data.id, data.attending)

  const creatorFallback = data.creatorAddress ? formatEthAddress(data.creatorAddress) : undefined
  const { creatorName, avatarFace } = useCreatorProfile(data.creatorAddress, data.creatorName, creatorFallback)
  const hasCreator = Boolean(avatarFace || creatorName)
  const { canEdit } = useCanEditEvent(data.creatorAddress)
  const showEdit = canEdit && Boolean(onEdit) && data.isEvent

  const handleCopy = useCallback(() => {
    const shareUrl = data.isEvent ? buildEventShareUrl(data.id, data.live) : data.url
    navigator.clipboard
      ?.writeText(shareUrl)
      ?.then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(err => console.warn('[EventDetailModal] Failed to copy:', err))
  }, [data.id, data.isEvent, data.live, data.url])

  const handleAddToCalendar = useCallback(() => {
    const url = buildCalendarUrl(data)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }, [data])

  const categorySubtitle = data.categories[0] ?? null

  return (
    <>
      <HeroSection>
        {data.image && <HeroImage src={data.image} alt={data.name} />}
        <HeroOverlay />
        <CloseButton onClick={onClose} aria-label={t('event_detail.close')}>
          {isMobile ? <ArrowBackIosNewIcon sx={{ fontSize: 20, color: '#FCFCFC' }} /> : <CloseIconStyled />}
        </CloseButton>
        <HeroContent>
          {data.live ? (
            <LiveBadgeWrapper>
              <LiveBadge />
            </LiveBadgeWrapper>
          ) : (
            categorySubtitle && <CategoryLabel>{categorySubtitle}</CategoryLabel>
          )}
          <ModalTitle id="event-detail-title">{data.name}</ModalTitle>
          {hasCreator && (
            <CreatorRow>
              {avatarFace ? <AvatarImage src={avatarFace} alt={creatorName ?? ''} /> : <AvatarFallback />}
              <CreatorName>
                {t('event_detail.by_prefix')}
                <CreatorNameHighlight>{creatorName}</CreatorNameHighlight>
              </CreatorName>
            </CreatorRow>
          )}
          <ActionsRow>
            {data.live && (
              <JumpInButton position={`${data.x},${data.y}`} size="medium">
                {t('event_detail.jump_in')}
              </JumpInButton>
            )}
            {data.isEvent && !data.live && (
              <Tooltip title={t('event_detail.remind_me')} placement="top" arrow>
                <SecondaryButton onClick={handleRemindToggle} disabled={isRemindLoading} aria-label={t('event_detail.remind_me')}>
                  <RemindMeIcon active={isReminded} shaking={isShaking} size={20} />
                </SecondaryButton>
              </Tooltip>
            )}
            {data.startAt && (
              <Tooltip title={t('event_detail.add_to_calendar')} placement="top" arrow>
                <SecondaryButton onClick={handleAddToCalendar} aria-label={t('event_detail.add_to_calendar')}>
                  <CalendarMonthIcon fontSize="small" />
                </SecondaryButton>
              </Tooltip>
            )}
            <Tooltip title={copied ? t('event_detail.copied') : t('event_detail.copy_link')} placement="top" arrow>
              <CopyButton onClick={handleCopy} aria-label={t('event_detail.copy_link')}>
                <CopyIconStyled />
              </CopyButton>
            </Tooltip>
            {showEdit && (
              <EditButton onClick={onEdit} aria-label={t('event_detail.edit')}>
                {t('event_detail.edit')}
                <EditIcon fontSize="small" />
              </EditButton>
            )}
          </ActionsRow>
        </HeroContent>
      </HeroSection>
    </>
  )
}

export { EventDetailModalHero }
