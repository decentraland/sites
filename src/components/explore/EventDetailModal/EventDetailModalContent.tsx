import { useCallback } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import { useTranslation } from '@dcl/hooks'
import type { RecurrentFrequency } from '../../../features/explore-events'
import { buildCalendarUrl } from '../../../utils/exploreUrl'
import type { ModalEventData } from './EventDetailModal.types'
import {
  ContentDivider,
  ContentSection,
  DescriptionText,
  RecurrenceText,
  ScheduleIconButton,
  ScheduleRow,
  ScheduleText,
  SectionLabel
} from './EventDetailModal.styled'

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

function getRecurrenceLabel(frequency: RecurrentFrequency | null, t: (key: string) => string): string | null {
  switch (frequency) {
    case 'DAILY':
      return t('event_detail.recurrent_daily')
    case 'WEEKLY':
      return t('event_detail.recurrent_weekly')
    case 'MONTHLY':
      return t('event_detail.recurrent_monthly')
    default:
      return null
  }
}

function EventDetailModalContent({ data }: { data: ModalEventData }) {
  const { t } = useTranslation()

  const hasDescription = Boolean(data.description)
  const hasSchedule = Boolean(data.startAt)

  const handleAddToCalendar = useCallback(() => {
    const url = buildCalendarUrl(data)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }, [data])

  if (!hasDescription && !hasSchedule) {
    return null
  }

  const recurrenceLabel = data.recurrent ? getRecurrenceLabel(data.recurrentFrequency, t) : null

  return (
    <ContentSection>
      {hasDescription && (
        <>
          <SectionLabel>{t('event_detail.what_to_expect')}</SectionLabel>
          <DescriptionText>{data.description}</DescriptionText>
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
    </ContentSection>
  )
}

export { EventDetailModalContent }
