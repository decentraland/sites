type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'unique'

interface WearableParsed {
  id: string
  urn: string
  name: string
  image: string
  rarity: Rarity
  collectionId?: string
  blockchainId?: string
}

interface ImageUser {
  userName: string
  userAddress: string
  isGuest: boolean
  wearables: string[]
  wearablesParsed?: WearableParsed[]
  faceUrl?: string
}

interface ImageMetadata {
  userName: string
  userAddress: string
  dateTime: string
  realm: string
  scene: {
    name: string
    location: {
      x: string
      y: string
    }
  }
  visiblePeople: ImageUser[]
}

interface Image {
  id: string
  url: string
  thumbnailUrl: string
  metadata: ImageMetadata
}

interface FetchListOptions {
  limit: number
  offset: number
}

interface FetchListResult {
  images: Image[]
  // eslint-disable-next-line @typescript-eslint/naming-convention
  current_images: number
  // eslint-disable-next-line @typescript-eslint/naming-convention
  max_images: number
}

export type { Rarity, WearableParsed, ImageUser, ImageMetadata, Image, FetchListOptions, FetchListResult }
