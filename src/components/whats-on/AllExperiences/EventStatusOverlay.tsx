import { memo } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from '@dcl/hooks'
import type { EventEntry } from '../../../features/whats-on-events'
import { getEventStatus } from '../PendingEventCard/PendingEventCard.helpers'
import { CardFrame, ChipOverlay, StatusChip } from '../PendingEventCard/PendingEventCard.styled'

interface EventStatusOverlayProps {
  event: EventEntry
  children: ReactNode
}

const STATUS_LABEL_KEY = {
  pending: 'my_experiences.status_pending',
  rejected: 'my_experiences.status_rejected'
} as const

const EventStatusOverlay = memo(function EventStatusOverlay({ event, children }: EventStatusOverlayProps) {
  const { t } = useTranslation()
  const status = getEventStatus(event)

  if (status === 'approved') return <>{children}</>

  return (
    <CardFrame>
      <ChipOverlay>
        <span />
        <StatusChip status={status}>{t(STATUS_LABEL_KEY[status])}</StatusChip>
      </ChipOverlay>
      {children}
    </CardFrame>
  )
})

export { EventStatusOverlay }
export type { EventStatusOverlayProps }
