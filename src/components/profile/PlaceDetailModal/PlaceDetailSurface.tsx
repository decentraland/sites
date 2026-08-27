import { useMemo } from 'react'
import { PlaceDetailModalContent, PlaceDetailModalHero } from '../../whats-on/PlaceDetailModal'
import { normalizeProfilePlace } from './normalizers'
import type { PlaceDetailSurfaceProps } from './PlaceDetailModal.types'

// Renders the same Hero + Content used by the standalone whats-on PlaceDetailModal
// so the swap-in-profile view is visually identical to the URL-driven dialog at
// /events?world=... or /events?position=x,y. The Events Hero already
// supports `onBack` — when set, the close button becomes a back chevron returning
// to the parent surface; `onClose` still dismisses the whole dialog.
function PlaceDetailSurface({ place, onClose, onBack }: PlaceDetailSurfaceProps) {
  const data = useMemo(() => normalizeProfilePlace(place), [place])
  return (
    <>
      <PlaceDetailModalHero data={data} onClose={onClose} onBack={onBack} />
      <PlaceDetailModalContent data={data} />
    </>
  )
}

export { PlaceDetailSurface }
