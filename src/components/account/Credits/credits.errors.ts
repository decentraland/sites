import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

type CreditsError = FetchBaseQueryError | SerializedError | undefined

// i18n keys for the opt-out flow. We never surface the raw server body (Pre-PR rule 10):
// the only actionable, user-facing case is "already claimed credits this week" (the server
// rejects opt-out then); everything else collapses to a generic retry message.
const OPT_OUT_GENERIC_ERROR = 'account.credits.leave_modal.errors.generic'
const OPT_OUT_ALREADY_CLAIMED_ERROR = 'account.credits.leave_modal.errors.already_claimed'

const extractServerMessage = (error: FetchBaseQueryError): string => {
  const data = error.data
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const message = record.message ?? record.error
    if (typeof message === 'string') return message
  }
  return ''
}

const isAlreadyClaimed = (error: FetchBaseQueryError): boolean => {
  // The credits-server returns a 4xx whose message mentions already-claimed credits when the
  // wallet has claimed this week. Match on the documented phrasing rather than echoing it.
  const message = extractServerMessage(error).toLowerCase()
  return message.includes('already claimed') || message.includes('claimed credits')
}

const mapOptOutErrorToI18nKey = (error: CreditsError): string => {
  if (error && 'status' in error && isAlreadyClaimed(error)) {
    return OPT_OUT_ALREADY_CLAIMED_ERROR
  }
  return OPT_OUT_GENERIC_ERROR
}

export { OPT_OUT_ALREADY_CLAIMED_ERROR, OPT_OUT_GENERIC_ERROR, mapOptOutErrorToI18nKey }
export type { CreditsError }
