import type { AuthIdentity } from '@dcl/crypto'
import type { ReportFormState } from '../features/report/report.types'

interface UseSubmitReportOptions {
  identity: AuthIdentity | undefined
}

interface UseSubmitReportResult {
  submitReport: (formState: ReportFormState) => Promise<boolean>
  isSubmitting: boolean
  error: string | null
}

export type { UseSubmitReportOptions, UseSubmitReportResult }
