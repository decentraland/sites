type EventsApiEvent = {
  id: string
  name: string
  approved: boolean
  rejected: boolean
  [key: string]: unknown
}

type EventsApiResponse = {
  ok: boolean
  data: {
    events: EventsApiEvent[]
    total: number
  }
}

export type { EventsApiEvent, EventsApiResponse }
