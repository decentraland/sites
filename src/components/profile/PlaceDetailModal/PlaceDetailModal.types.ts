import type { ProfilePlace } from '../../../features/profile/profile.places.client'

interface PlaceDetailSurfaceProps {
  place: ProfilePlace
  onClose: () => void
  /** When provided, renders a back chevron in the header (used when swapping inside an outer modal). */
  onBack?: () => void
}

interface PlaceDetailModalProps {
  place: ProfilePlace | null
  onClose: () => void
}

export type { PlaceDetailModalProps, PlaceDetailSurfaceProps }
