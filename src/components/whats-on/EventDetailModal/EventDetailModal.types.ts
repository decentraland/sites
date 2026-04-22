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
}

export type { AdminActions, EventDetailModalProps, ModalEventData }
