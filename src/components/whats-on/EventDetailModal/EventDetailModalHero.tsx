import { useCallback, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
// eslint-disable-next-line @typescript-eslint/naming-convention
import EditIcon from '@mui/icons-material/Edit'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PublicRoundedIcon from '@mui/icons-material/PublicRounded'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTranslation } from '@dcl/hooks'
import { LiveBadge, Tooltip, useTheme } from 'decentraland-ui2'
import type { RecurrentFrequency } from '../../../features/events'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useCanEditEvent } from '../../../hooks/useCanEditEvent'
import { useCopyShareLink } from '../../../hooks/useCopyShareLink'
import { useRemindMe } from '../../../hooks/useRemindMe'
import { localizedWeekdayLong, normalizeDayIndices } from '../../../utils/recurrence'
import { formatLocalDate, formatLocalTime } from '../../../utils/whatsOnTime'
import { buildCalendarUrl, buildEventShareUrl, normalizeRecurrence } from '../../../utils/whatsOnUrl'
import { JumpInButton } from '../../jump/JumpInButton'
import { LocalDateTimeTooltip } from '../common/LocalDateTimeTooltip'
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
import { CreatorLocationRow, EditButton, LiveBadgeWrapper, LocationRow, LocationText, ScheduleSubtitle } from './EventDetailModal.styled'

function getHeroRecurrenceLabel(
  startAt: string,
  frequency: RecurrentFrequency | null,
  interval: number | null,
  byDay: number[] | undefined,
  t: (key: string, values?: Record<string, string | number>) => string,
  locale: string
): string | null {
  const { frequency: normalizedFrequency, interval: count } = normalizeRecurrence(frequency, interval)
  if (byDay && byDay.length > 0 && byDay.length < 7) {
    const days = normalizeDayIndices(byDay)
      .map(i => localizedWeekdayLong(i, locale))
      .join(', ')
    return count > 1 ? t('event_detail.recurrent_on_days_every_n_weeks', { count, days }) : t('event_detail.hero_every_days', { days })
  }
  switch (normalizedFrequency) {
    case 'DAILY':
      return count === 1 ? t('event_detail.hero_every_day') : t('event_detail.recurrent_every_n_days', { count })
    case 'WEEKLY': {
      if (count > 1) return t('event_detail.recurrent_every_n_weeks', { count })
      // Derive the weekday from the local-time `startAt` — keeps the recurrence label aligned with the user's calendar.
      const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(new Date(startAt))
      return t('event_detail.hero_every_weekday', { weekday })
    }
    case 'MONTHLY':
      return count === 1 ? t('event_detail.hero_every_month') : t('event_detail.recurrent_every_n_months', { count })
    case 'YEARLY':
      return count === 1 ? t('event_detail.hero_every_year') : t('event_detail.recurrent_every_n_years', { count })
    default:
      return null
  }
}

function buildHeroSubtitle(
  data: ModalEventData,
  t: (key: string, values?: Record<string, string | number>) => string,
  locale: string
): string | null {
  if (!data.startAt) return null
  const start = new Date(data.startAt)
  if (Number.isNaN(start.getTime())) return null
  const time = formatLocalTime(data.startAt, locale)
  if (!data.recurrent) {
    const date = formatLocalDate(data.startAt, locale)
    return `${date} - ${time}`
  }
  const recurrence = getHeroRecurrenceLabel(data.startAt, data.recurrentFrequency, data.recurrentInterval, data.recurrentByDay, t, locale)
  if (!recurrence) return null
  return `${recurrence} - ${time}`
}

function EventDetailModalHero({ data, onClose, onEdit }: { data: ModalEventData; onClose: () => void; onEdit?: () => void }) {
  const { t, locale } = useTranslation()
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

  const scheduleSubtitle = useMemo(() => buildHeroSubtitle(data, t, locale), [data, t, locale])

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
            scheduleSubtitle &&
            data.startAt && (
              <LocalDateTimeTooltip startIso={data.startAt} finishIso={data.finishAt}>
                <ScheduleSubtitle>{scheduleSubtitle}</ScheduleSubtitle>
              </LocalDateTimeTooltip>
            )
          )}
          <ModalTitle id="event-detail-title">{data.name}</ModalTitle>
          <CreatorLocationRow>
            <DetailModalCreator address={data.creatorAddress} name={data.creatorName} prefixLabel={t('event_detail.by_prefix')} />
            {data.isWorld ? (
              data.realm && (
                <LocationRow>
                  <PublicRoundedIcon />
                  <LocationText>{data.realm}</LocationText>
                </LocationRow>
              )
            ) : (
              <LocationRow>
                <LocationOnOutlinedIcon />
                <LocationText>
                  {data.placeName
                    ? t('event_detail.location_with_coords', { place: data.placeName, x: data.x, y: data.y })
                    : t('event_detail.location_coords', { x: data.x, y: data.y })}
                </LocationText>
              </LocationRow>
            )}
          </CreatorLocationRow>
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
