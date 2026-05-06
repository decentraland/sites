import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error && ('data' in error || 'error' in error)
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string'
}

// Returns a user-safe error string. Caller is expected to map it through i18n
// before showing — never propagate raw server bodies (CLAUDE.md rule 10).
function describeError(err: unknown): 'fetch' | 'message' | 'unknown' {
  if (!err) return 'unknown'
  if (isFetchBaseQueryError(err)) return 'fetch'
  if (isErrorWithMessage(err)) return 'message'
  return 'unknown'
}

export { describeError, isErrorWithMessage, isFetchBaseQueryError }
