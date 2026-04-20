import { EventDetailModalContent } from './EventDetailModalContent'
import { EventDetailModalHero } from './EventDetailModalHero'
import type { EventDetailModalProps } from './EventDetailModal.types'
import { StyledDialog } from './EventDetailModal.styled'

function EventDetailModal({ open, onClose, data }: EventDetailModalProps) {
  return (
    <StyledDialog open={open && !!data} onClose={onClose} aria-labelledby="event-detail-title" fullWidth>
      {data && (
        <>
          <EventDetailModalHero data={data} onClose={onClose} />
          <EventDetailModalContent data={data} />
        </>
      )}
    </StyledDialog>
  )
}

export { EventDetailModal }
