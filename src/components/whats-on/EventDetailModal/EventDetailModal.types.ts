import type { RecurrentFrequency } from '../../../features/whats-on-events'

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
  realm?: string
  // False when the modal is opened from a live scene without a matching event — the bell (attendees API) requires a real event UUID.
  isEvent: boolean
}

interface AdminActions {
  onApprove: () => void
  onReject: () => void
  isProcessing: boolean
}

interface EventDetailModalProps {
  open: boolean
  onClose: () => void
  data: ModalEventData | null
  adminActions?: AdminActions
  onEdit?: () => void
}

export type { AdminActions, EventDetailModalProps, ModalEventData }
