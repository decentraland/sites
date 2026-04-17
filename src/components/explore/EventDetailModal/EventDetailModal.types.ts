import type { RecurrentFrequency } from '../../../features/explore-events'

interface ModalEventData {
  id: string
  name: string
  description: string | null
  image: string | null
  x: number
  y: number
  creatorAddress: string | undefined
  creatorName: string | undefined
  startAt: string | null
  finishAt: string | null
  recurrent: boolean
  recurrentFrequency: RecurrentFrequency | null
  recurrentDates: string[]
  totalAttendees: number
  attending?: boolean
  live: boolean
  categories: string[]
  url: string
}

interface EventDetailModalProps {
  open: boolean
  onClose: () => void
  data: ModalEventData | null
}

export type { EventDetailModalProps, ModalEventData }
