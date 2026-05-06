import { useCallback } from 'react'
import { ReportReason } from '../features/report/report.types'
import type { ReportFormDraft, ReportFormDraftInput, UseReportFormDraftResult } from './useReportFormDraft.types'

const DRAFT_KEY = 'report_form_draft'
const DRAFT_TTL_MS = 15 * 60 * 1000

const VALID_REASONS = new Set<string>(Object.values(ReportReason))

function isValidDraft(value: unknown): value is ReportFormDraft {
  if (!value || typeof value !== 'object') return false
  const draft = value as ReportFormDraft
  return (
    typeof draft.searchParams === 'string' &&
    typeof draft.reportedAddress === 'string' &&
    typeof draft.description === 'string' &&
    typeof draft.additionalComments === 'string' &&
    typeof draft.savedAt === 'number' &&
    (draft.reason === '' || VALID_REASONS.has(draft.reason))
  )
}

function useReportFormDraft(): UseReportFormDraftResult {
  const saveDraft = useCallback((input: ReportFormDraftInput) => {
    try {
      const draft: ReportFormDraft = { ...input, savedAt: Date.now() }
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // sessionStorage unavailable (private mode); drop the draft silently.
    }
  }, [])

  const restoreDraft = useCallback((): ReportFormDraft | null => {
    try {
      const stored = sessionStorage.getItem(DRAFT_KEY)
      sessionStorage.removeItem(DRAFT_KEY)
      if (!stored) return null
      const parsed: unknown = JSON.parse(stored)
      if (!isValidDraft(parsed)) return null
      if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) return null
      return parsed
    } catch {
      return null
    }
  }, [])

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
  }, [])

  return { saveDraft, restoreDraft, clearDraft }
}

export { useReportFormDraft }
