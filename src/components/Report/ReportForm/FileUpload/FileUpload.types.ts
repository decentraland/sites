import type { UploadedFile } from '../../../../features/report/report.types'

interface FileUploadProps {
  files: UploadedFile[]
  onFilesChange: (files: UploadedFile[]) => void
  error?: string
  addFileLabel: string
  oversizedLabel: (names: string) => string
  invalidTypeLabel: (names: string) => string
}

export type { FileUploadProps }
