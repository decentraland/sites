import type { ReportReason } from '../features/report/report.types'

interface ReportFormDraftInput {
  searchParams: string
  reportedAddress: string
  reason: ReportReason | ''
  description: string
  additionalComments: string
}

interface ReportFormDraft extends ReportFormDraftInput {
  savedAt: number
}

interface UseReportFormDraftResult {
  saveDraft: (draft: ReportFormDraftInput) => void
  restoreDraft: () => ReportFormDraft | null
  clearDraft: () => void
}

export type { ReportFormDraft, ReportFormDraftInput, UseReportFormDraftResult }
