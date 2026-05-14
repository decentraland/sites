import { useCallback } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { useTranslation } from '@dcl/hooks'
import { Button } from 'decentraland-ui2'
import type { RecurrentFrequency } from '../../../features/events'
import { linkifyText } from '../../../utils/linkifyText'
import { buildCalendarUrl } from '../../../utils/whatsOnUrl'
import { ContentDivider, ContentSection, DescriptionText, SectionLabel } from '../DetailModal/DetailModal.styled'
import type { AdminActions, ModalEventData } from './EventDetailModal.types'
import { AdminActionsRow, RecurrenceText, ScheduleIconButton, ScheduleRow, ScheduleText } from './EventDetailModal.styled'

function formatScheduleDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function formatScheduleTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
}

function getRecurrenceLabel(
  frequency: RecurrentFrequency | null,
  interval: number | null,
  t: (key: string, values?: Record<string, string | number>) => string
): string | null {
  const count = interval && interval > 1 ? interval : 1
  // Legacy events stored bi-weekly recurrence as DAILY × 14 instead of WEEKLY × 2.
  // Re-express DAILY intervals that are a clean multiple of 7 as weekly.
  if (frequency === 'DAILY' && count > 1 && count % 7 === 0) {
    const weeks = count / 7
    return weeks === 1 ? t('event_detail.recurrent_weekly') : t('event_detail.recurrent_every_n_weeks', { count: weeks })
  }
  switch (frequency) {
    case 'DAILY':
      return count === 1 ? t('event_detail.recurrent_daily') : t('event_detail.recurrent_every_n_days', { count })
    case 'WEEKLY':
      return count === 1 ? t('event_detail.recurrent_weekly') : t('event_detail.recurrent_every_n_weeks', { count })
    case 'MONTHLY':
      return count === 1 ? t('event_detail.recurrent_monthly') : t('event_detail.recurrent_every_n_months', { count })
    default:
      return null
  }
}

function EventDetailModalContent({ data, adminActions }: { data: ModalEventData; adminActions?: AdminActions }) {
  const { t } = useTranslation()

  const hasDescription = Boolean(data.description)
  const hasSchedule = Boolean(data.startAt)

  const handleAddToCalendar = useCallback(() => {
    const url = buildCalendarUrl(data)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }, [data])

  if (!hasDescription && !hasSchedule && !adminActions) {
    return null
  }

  const recurrenceLabel = data.recurrent ? getRecurrenceLabel(data.recurrentFrequency, data.recurrentInterval, t) : null

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
              <ScheduleText>
                {formatScheduleDate(data.startAt)} · {formatScheduleTime(data.startAt)}
                {data.finishAt && ` – ${formatScheduleTime(data.finishAt)}`}
              </ScheduleText>
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
