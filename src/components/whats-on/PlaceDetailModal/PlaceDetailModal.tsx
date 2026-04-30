import { StyledDialog } from '../EventDetailModal/EventDetailModal.styled'
import { PlaceDetailModalContent } from './PlaceDetailModalContent'
import { PlaceDetailModalHero } from './PlaceDetailModalHero'
import type { PlaceDetailModalProps } from './PlaceDetailModal.types'

function PlaceDetailModal({ open, onClose, data }: PlaceDetailModalProps) {
  return (
    <StyledDialog open={open && !!data} onClose={onClose} aria-labelledby="place-detail-title" fullWidth>
      {data && (
        <>
          <PlaceDetailModalHero data={data} onClose={onClose} />
          <PlaceDetailModalContent data={data} />
        </>
      )}
    </StyledDialog>
  )
}

export { PlaceDetailModal }
