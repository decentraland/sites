interface EventEntry {
  id: string
  name: string
  image: string
  x: number
  y: number
  url: string
  live: boolean
  coordinates: [number, number]
  user: string
}

interface EventsResponse {
  ok: boolean
  total: number
  data: EventEntry[]
}

interface HotScene {
  id: string
  name: string
  baseCoords: [number, number]
  usersTotalCount: number
  parcels: Array<[number, number]>
  thumbnail: string
}

enum WhatsOnCardType {
  EVENT = 'event',
  PLACE = 'place'
}

interface WhatsOn {
  type: WhatsOnCardType
  id: string
  title: string
  users: number
  image: string
  coordinates: string
  creatorAddress?: string
  creatorName?: string
  isGenesisPlaza: boolean
}

export { WhatsOnCardType }
export type { EventEntry, EventsResponse, HotScene, WhatsOn }
