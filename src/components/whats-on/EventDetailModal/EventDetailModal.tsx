import { StyledDialog } from '../DetailModal/DetailModal.styled'
import { EventDetailModalContent } from './EventDetailModalContent'
import { EventDetailModalHero } from './EventDetailModalHero'
import type { EventDetailModalProps } from './EventDetailModal.types'

function EventDetailModal({ open, onClose, data, adminActions, onEdit }: EventDetailModalProps) {
  return (
    <StyledDialog open={open && !!data} onClose={onClose} aria-labelledby="event-detail-title" fullWidth>
      {data && (
        <>
          <EventDetailModalHero data={data} onClose={onClose} onEdit={onEdit} />
          <EventDetailModalContent data={data} adminActions={adminActions} />
        </>
      )}
    </StyledDialog>
  )
}

export { EventDetailModal }
