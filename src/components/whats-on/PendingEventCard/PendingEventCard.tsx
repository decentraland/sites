import { memo } from 'react'
import { useTranslation } from '@dcl/hooks'
import type { EventEntry } from '../../../features/events'
import { FutureCard } from '../AllExperiences/FutureCard'
import { getEventStatus, getRelativeDateLabel } from './PendingEventCard.helpers'
import { CardFrame, ChipOverlay, DateChip, StatusChip } from './PendingEventCard.styled'

interface PendingEventCardProps {
  event: EventEntry
  onClick: (event: EventEntry) => void
}

const STATUS_LABEL_KEY: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: 'whats_on_admin.pending_events.status_pending',
  approved: 'whats_on_admin.pending_events.status_approved',
  rejected: 'whats_on_admin.pending_events.status_rejected'
}

const PendingEventCard = memo(function PendingEventCard({ event, onClick }: PendingEventCardProps) {
  const { t } = useTranslation()
  const status = getEventStatus(event)
  const referenceStart = event.recurrent && event.next_start_at ? event.next_start_at : event.start_at
  const dateLabel = getRelativeDateLabel(referenceStart, t)

  const isPending = status === 'pending'

  return (
    <CardFrame faded={isPending} aria-disabled={isPending}>
      <ChipOverlay>
        {dateLabel ? <DateChip>{dateLabel}</DateChip> : <span />}
        <StatusChip status={status}>{t(STATUS_LABEL_KEY[status])}</StatusChip>
      </ChipOverlay>
      <FutureCard event={event} onClick={onClick} />
    </CardFrame>
  )
})

export { PendingEventCard }
export type { PendingEventCardProps }
