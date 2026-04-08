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

enum ExploreCardType {
  EVENT = 'event',
  PLACE = 'place'
}

interface ExploreItem {
  type: ExploreCardType
  id: string
  title: string
  users: number
  image: string
  coordinates: string
  creatorAddress?: string
  creatorName?: string
}

export { ExploreCardType }
export type { EventEntry, EventsResponse, ExploreItem, HotScene }
