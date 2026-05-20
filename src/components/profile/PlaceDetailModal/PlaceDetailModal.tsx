import { useMemo } from 'react'
import { StyledDialog } from '../../whats-on/DetailModal/DetailModal.styled'
import { PlaceDetailModalContent, PlaceDetailModalHero } from '../../whats-on/PlaceDetailModal'
import { normalizeProfilePlace } from './normalizers'
import type { PlaceDetailModalProps } from './PlaceDetailModal.types'

// Standalone wrapper: identical Paper + Hero + Content to the whats-on
// PlaceDetailModal. Profile callers pass a ProfilePlace; we normalize and
// hand off to the same Hero+Content components.
function PlaceDetailModal({ place, onClose }: PlaceDetailModalProps) {
  const data = useMemo(() => (place ? normalizeProfilePlace(place) : null), [place])
  return (
    <StyledDialog open={place !== null} onClose={onClose} aria-labelledby="place-detail-title" fullWidth maxWidth={false}>
      {data ? (
        <>
          <PlaceDetailModalHero data={data} onClose={onClose} />
          <PlaceDetailModalContent data={data} />
        </>
      ) : null}
    </StyledDialog>
  )
}

export { PlaceDetailModal }
