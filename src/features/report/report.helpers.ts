import { getEnv } from '../../config/env'
import { ReportReason } from './report.types'
import type { PresignFile, SubmitReportPayload, UploadedFile } from './report.types'

const FILENAME_SAFE_REGEX = /[^a-zA-Z0-9._-]/g

function getReportApiUrl(): string {
  const url = getEnv('REPORT_API_URL')
  if (!url) {
    throw new Error('REPORT_API_URL is required to submit reports')
  }
  return url
}

function sanitizeFilename(name: string): string {
  return name.replace(FILENAME_SAFE_REGEX, '-')
}

function buildPresignFiles(evidence: UploadedFile[]): PresignFile[] {
  return evidence.map(item => ({
    filename: sanitizeFilename(item.name),
    contentType: item.file.type,
    fileSize: item.size
  }))
}

const REASON_API_LABEL: Record<ReportReason, string> = {
  [ReportReason.SCAM_PHISHING]: 'Scam/Phishing',
  [ReportReason.ILLEGAL_CONTENT]: 'Illegal Content',
  [ReportReason.HARASSMENT]: 'Harassment',
  [ReportReason.CHEATING]: 'Cheating',
  [ReportReason.IMPERSONATION]: 'Impersonation'
}

function buildSubmitPayload(reportId: string, evidenceKeys: string[], formState: SubmitFormState): SubmitReportPayload {
  return {
    reportId,
    playerAddress: formState.playerAddress,
    reportedAddress: formState.reportedAddress,
    reason: formState.reason ? REASON_API_LABEL[formState.reason] : '',
    description: formState.description,
    additionalComments: formState.additionalComments,
    confirmAccuracy: formState.confirmAccuracy,
    evidenceKeys
  }
}

interface SubmitFormState {
  playerAddress: string
  reportedAddress: string
  reason: ReportReason | ''
  description: string
  additionalComments: string
  confirmAccuracy: boolean
}

export { REASON_API_LABEL, buildPresignFiles, buildSubmitPayload, getReportApiUrl }
export type { SubmitFormState }
