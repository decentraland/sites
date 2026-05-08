enum ReportReason {
  SCAM_PHISHING = 'scam_phishing',
  ILLEGAL_CONTENT = 'illegal_content',
  HARASSMENT = 'harassment',
  CHEATING = 'cheating',
  IMPERSONATION = 'impersonation'
}

interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
}

interface ReportFormState {
  playerAddress: string
  reportedAddress: string
  reason: ReportReason | ''
  description: string
  evidence: UploadedFile[]
  additionalComments: string
  confirmAccuracy: boolean
}

interface ReportFormErrors {
  playerAddress: string
  reportedAddress: string
  reason: string
  description: string
  evidence: string
  confirmAccuracy: string
}

interface PresignFile {
  filename: string
  contentType: string
  fileSize: number
}

interface PresignRequest {
  files: PresignFile[]
}

interface PresignResponseFile {
  uploadUrl: string
  key: string
  publicUrl: string
}

interface PresignResponse {
  reportId: string
  files: PresignResponseFile[]
}

interface SubmitReportPayload {
  reportId: string
  playerAddress: string
  reportedAddress: string
  reason: string
  description: string
  additionalComments: string
  confirmAccuracy: boolean
  evidenceKeys: string[]
}

export { ReportReason }
export type {
  PresignFile,
  PresignRequest,
  PresignResponse,
  PresignResponseFile,
  ReportFormErrors,
  ReportFormState,
  SubmitReportPayload,
  UploadedFile
}
