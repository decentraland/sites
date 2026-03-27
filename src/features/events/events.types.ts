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
  // eslint-disable-next-line @typescript-eslint/naming-convention
  next_start_at?: string
  // eslint-disable-next-line @typescript-eslint/naming-convention
  finish_at?: string
  attending?: number
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
}

export { WhatsOnCardType }
export type { EventEntry, EventsResponse, HotScene, WhatsOn }
