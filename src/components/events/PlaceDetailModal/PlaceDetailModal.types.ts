interface ModalPlaceData {
  id: string
  title: string
  description: string | null
  image: string | null
  coordinates: [number, number]
  ownerAddress: string | undefined
  ownerName: string | undefined
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

export type { ModalPlaceData, PlaceDetailModalProps }
