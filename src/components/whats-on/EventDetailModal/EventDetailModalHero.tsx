import { useCallback, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EditIcon from '@mui/icons-material/Edit'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTranslation } from '@dcl/hooks'
import { LiveBadge, Tooltip, useTheme } from 'decentraland-ui2'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useCanEditEvent } from '../../../hooks/useCanEditEvent'
import { useCopyShareLink } from '../../../hooks/useCopyShareLink'
import { useRemindMe } from '../../../hooks/useRemindMe'
import { buildCalendarUrl, buildEventShareUrl } from '../../../utils/whatsOnUrl'
import { JumpInButton } from '../../jump/JumpInButton'
import { RemindMeIcon } from '../common/RemindMeIcon'
import { DetailModalCreator } from '../DetailModal'
import {
  ActionsRow,
  CloseButton,
  CloseIconStyled,
  CopyButton,
  CopyIconStyled,
  HeroContent,
  HeroImage,
  HeroOverlay,
  HeroSection,
  ModalTitle,
  PrimaryActionButton,
  SecondaryButton
} from '../DetailModal/DetailModal.styled'
import type { ModalEventData } from './EventDetailModal.types'
import { CategoryLabel, EditButton, LiveBadgeWrapper } from './EventDetailModal.styled'

function EventDetailModalHero({ data, onClose, onEdit }: { data: ModalEventData; onClose: () => void; onEdit?: () => void }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { isReminded, isLoading: isRemindLoading, isShaking, handleToggle: handleRemindToggle } = useRemindMe(data.id, data.attending)
  const { hasValidIdentity } = useAuthIdentity()
  const { canEdit } = useCanEditEvent(data.creatorAddress)
  const showEdit = canEdit && Boolean(onEdit) && data.isEvent

  const isFutureEvent = data.isEvent && !data.live
  const showRemindMePrimary = isFutureEvent && hasValidIdentity
  const showCalendarPrimary = isFutureEvent && !hasValidIdentity && Boolean(data.startAt)
  const showRemindMeSecondary = isFutureEvent && !hasValidIdentity
  const showCalendarSecondary = !showCalendarPrimary && Boolean(data.startAt)

  const isPreview = data.id === 'preview'
  const shareUrl = useMemo(
    () => (data.isEvent ? buildEventShareUrl(data.id, data.live) : data.url),
    [data.id, data.isEvent, data.live, data.url]
  )
  const { copied, handleCopy } = useCopyShareLink(shareUrl)

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
          <DetailModalCreator address={data.creatorAddress} name={data.creatorName} prefixLabel={t('event_detail.by_prefix')} />
          <ActionsRow>
            {data.live && (
              <JumpInButton position={`${data.x},${data.y}`} size="medium">
                {t('event_detail.jump_in')}
              </JumpInButton>
            )}
            {showRemindMePrimary && (
              <PrimaryActionButton onClick={handleRemindToggle} disabled={isRemindLoading} aria-label={t('event_detail.remind_me')}>
                <RemindMeIcon active={isReminded} shaking={isShaking} size={20} />
                {t('event_detail.remind_me')}
              </PrimaryActionButton>
            )}
            {showCalendarPrimary && (
              <PrimaryActionButton onClick={handleAddToCalendar} aria-label={t('event_detail.add_to_calendar')}>
                <CalendarMonthIcon fontSize="small" />
                {t('event_detail.add_to_calendar')}
              </PrimaryActionButton>
            )}
            {showRemindMeSecondary && (
              <Tooltip title={t('event_detail.remind_me')} placement="top" arrow>
                <SecondaryButton onClick={handleRemindToggle} disabled={isRemindLoading} aria-label={t('event_detail.remind_me')}>
                  <RemindMeIcon active={isReminded} shaking={isShaking} size={20} />
                </SecondaryButton>
              </Tooltip>
            )}
            {showCalendarSecondary && (
              <Tooltip title={t('event_detail.add_to_calendar')} placement="top" arrow>
                <SecondaryButton onClick={handleAddToCalendar} aria-label={t('event_detail.add_to_calendar')}>
                  <CalendarMonthIcon fontSize="small" />
                </SecondaryButton>
              </Tooltip>
            )}
            {!isPreview && (
              <Tooltip title={copied ? t('event_detail.copied') : t('event_detail.copy_link')} placement="top" arrow>
                <CopyButton onClick={handleCopy} aria-label={t('event_detail.copy_link')}>
                  <CopyIconStyled />
                </CopyButton>
              </Tooltip>
            )}
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
