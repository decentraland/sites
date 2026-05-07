import { REJECTION_REASON_MAX_LENGTH } from '../../features/experiences/events/admin/admin.types'
import type { RejectReasonCode } from '../../features/experiences/events/admin/admin.types'

function buildRejectionReason(reasons: RejectReasonCode[], notes: string, t: (key: string) => string): string {
  const titles = reasons.map(reason => t(`whats_on_admin.reject_modal.reasons.${reason}.title`)).join(', ')
  const trimmedNotes = notes.trim()
  return [titles, trimmedNotes].filter(Boolean).join('. ').slice(0, REJECTION_REASON_MAX_LENGTH)
}

export { buildRejectionReason }
