import { PlaceDetailSurface } from './PlaceDetailSurface'
import type { PlaceDetailModalProps } from './PlaceDetailModal.types'
import { PlaceDetailDialog } from './PlaceDetailModal.styled'

function PlaceDetailModal({ place, onClose }: PlaceDetailModalProps) {
  return (
    <PlaceDetailDialog open={place !== null} onClose={onClose} maxWidth={false} fullWidth>
      {place ? <PlaceDetailSurface place={place} onClose={onClose} /> : null}
    </PlaceDetailDialog>
  )
}

export { PlaceDetailModal }
