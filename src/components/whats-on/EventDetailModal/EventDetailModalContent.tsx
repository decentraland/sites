import { useCallback } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { useTranslation } from '@dcl/hooks'
import { Button } from 'decentraland-ui2'
import type { RecurrentFrequency } from '../../../features/events'
import { linkifyText } from '../../../utils/linkifyText'
import { localizedWeekdayShort, normalizeDayIndices } from '../../../utils/recurrence'
import { buildCalendarUrl, normalizeRecurrence } from '../../../utils/whatsOnUrl'
import { ContentDivider, ContentSection, DescriptionText, SectionLabel } from '../DetailModal/DetailModal.styled'
import type { AdminActions, ModalEventData } from './EventDetailModal.types'
import { AdminActionsRow, RecurrenceText, ScheduleIconButton, ScheduleRow, ScheduleText } from './EventDetailModal.styled'

function formatScheduleDate(isoString: string, locale: string): string {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date)
}

function formatScheduleTime(isoString: string, locale: string): string {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  }).format(date)
}

function formatRecurrentDays(days: number[], locale: string): string {
  return normalizeDayIndices(days)
    .map(i => localizedWeekdayShort(i, locale))
    .join(', ')
}

function getRecurrenceLabel(
  frequency: RecurrentFrequency | null,
  interval: number | null,
  byDay: number[] | undefined,
  t: (key: string, values?: Record<string, string | number>) => string,
  locale: string
): string | null {
  const { frequency: normalizedFrequency, interval: count } = normalizeRecurrence(frequency, interval)
  // Day-picker selection wins when present and partial — full week falls through to the frequency label.
  if (byDay && byDay.length > 0 && byDay.length < 7) {
    const days = formatRecurrentDays(byDay, locale)
    if (count > 1) {
      return t('event_detail.recurrent_on_days_every_n_weeks', { count, days })
    }
    return t('event_detail.recurrent_on_days', { days })
  }
  switch (normalizedFrequency) {
    case 'DAILY':
      return count === 1 ? t('event_detail.recurrent_daily') : t('event_detail.recurrent_every_n_days', { count })
    case 'WEEKLY':
      return count === 1 ? t('event_detail.recurrent_weekly') : t('event_detail.recurrent_every_n_weeks', { count })
    case 'MONTHLY':
      return count === 1 ? t('event_detail.recurrent_monthly') : t('event_detail.recurrent_every_n_months', { count })
    case 'YEARLY':
      return count === 1 ? t('event_detail.recurrent_yearly') : t('event_detail.recurrent_every_n_years', { count })
    default:
      return null
  }
}

function EventDetailModalContent({ data, adminActions }: { data: ModalEventData; adminActions?: AdminActions }) {
  const { t, locale } = useTranslation()

  const hasDescription = Boolean(data.description)
  const hasSchedule = Boolean(data.startAt)

  const handleAddToCalendar = useCallback(() => {
    const url = buildCalendarUrl(data)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }, [data])

  if (!hasDescription && !hasSchedule && !adminActions) {
    return null
  }

  const recurrenceLabel = data.recurrent
    ? getRecurrenceLabel(data.recurrentFrequency, data.recurrentInterval, data.recurrentByDay, t, locale)
    : null

  const scheduleRange = data.startAt
    ? `${formatScheduleDate(data.startAt, locale)} · ${formatScheduleTime(data.startAt, locale)}${data.finishAt ? ` – ${formatScheduleTime(data.finishAt, locale)}` : ''} (UTC)`
    : ''
  const scheduleText = data.recurrent && scheduleRange ? t('event_detail.schedule_starting', { schedule: scheduleRange }) : scheduleRange

  return (
    <ContentSection>
      {hasDescription && (
        <>
          <SectionLabel>{t('event_detail.what_to_expect')}</SectionLabel>
          <DescriptionText>{linkifyText(data.description ?? '')}</DescriptionText>
        </>
      )}
      {hasDescription && hasSchedule && <ContentDivider />}
      {hasSchedule && data.startAt && (
        <>
          <SectionLabel>{t('event_detail.schedule')}</SectionLabel>
          <ScheduleRow>
            <div>
              <ScheduleText>{scheduleText}</ScheduleText>
              {recurrenceLabel && <RecurrenceText>{recurrenceLabel}</RecurrenceText>}
            </div>
            <ScheduleIconButton onClick={handleAddToCalendar} aria-label={t('event_detail.add_to_calendar')}>
              <CalendarTodayIcon />
            </ScheduleIconButton>
          </ScheduleRow>
        </>
      )}
      {adminActions && (
        <AdminActionsRow>
          <Button variant="contained" color="primary" disabled={adminActions.isProcessing} onClick={adminActions.onApprove}>
            {t('whats_on_admin.pending_events.approve')}
          </Button>
          <Button variant="outlined" color="secondary" disabled={adminActions.isProcessing} onClick={adminActions.onReject}>
            {t('whats_on_admin.pending_events.reject')}
          </Button>
        </AdminActionsRow>
      )}
    </ContentSection>
  )
}

export { EventDetailModalContent }
