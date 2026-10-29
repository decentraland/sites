interface ModalPlaceData {
  id: string
  title: string
  description: string | null
  image: string | null
  coordinates: [number, number]
  ownerAddress: string | undefined
  contactName: string | undefined
  creatorAddress?: string | null
  favorites: number
  userCount: number
  isWorld: boolean
  worldName: string | null
}

interface PlaceDetailModalProps {
  open: boolean
  onClose: () => void
  data: ModalPlaceData | null
}

interface PlaceDetailModalCreatorProps {
  data: ModalPlaceData
  prefixLabel: string
}

export type { ModalPlaceData, PlaceDetailModalProps, PlaceDetailModalCreatorProps }
