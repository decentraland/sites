const REJECT_REASONS = ['invalid_image', 'invalid_event_name', 'inappropriate_description', 'invalid_duration', 'invalid_location'] as const

type RejectReasonCode = (typeof REJECT_REASONS)[number]

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

export { REJECT_REASONS }
export type { RejectEventModalProps, RejectReasonCode, RejectSubmitPayload }
