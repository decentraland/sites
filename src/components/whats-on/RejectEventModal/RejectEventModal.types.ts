import type { RejectReasonCode } from '../../../features/whats-on/admin/admin.types'

type RejectSubmitPayload = {
  reasons: RejectReasonCode[]
  notes: string
}

type RejectEventModalProps = {
  open: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (payload: RejectSubmitPayload) => void
}

export type { RejectEventModalProps, RejectSubmitPayload }
