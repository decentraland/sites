import { useCallback, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { UploadedFile } from '../../../../features/report/report.types'
import type { FileUploadProps } from './FileUpload.types'
import {
  AddFileButton,
  ErrorText,
  FileChip,
  FileChipRemove,
  FileChipsContainer,
  FileUploadContainer,
  HiddenFileInput
} from './FileUpload.styled'

const MAX_FILES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = 'image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm,application/pdf'

function FileUpload({ files, onFilesChange, error, addFileLabel, oversizedLabel }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [sizeError, setSizeError] = useState<string | null>(null)

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleFileSelect = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files
      if (!selectedFiles) return

      setSizeError(null)

      const remaining = MAX_FILES - files.length
      const selected = Array.from(selectedFiles).slice(0, remaining)

      const oversized = selected.filter(f => f.size > MAX_FILE_SIZE)
      if (oversized.length > 0) {
        setSizeError(oversizedLabel(oversized.map(f => f.name).join(', ')))
      }

      const newFiles: UploadedFile[] = selected
        .filter(f => f.size <= MAX_FILE_SIZE)
        .map(file => ({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size
        }))

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles])
      }

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [files, onFilesChange, oversizedLabel]
  )

  const handleRemove = useCallback(
    (id: string) => {
      onFilesChange(files.filter(f => f.id !== id))
    },
    [files, onFilesChange]
  )

  return (
    <FileUploadContainer>
      <HiddenFileInput ref={inputRef} type="file" multiple accept={ACCEPTED_TYPES} onChange={handleFileSelect} />
      {files.length > 0 && (
        <FileChipsContainer>
          {files.map(file => (
            <FileChip key={file.id}>
              {file.name}
              <FileChipRemove type="button" aria-label={`Remove ${file.name}`} onClick={() => handleRemove(file.id)}>
                ✕
              </FileChipRemove>
            </FileChip>
          ))}
        </FileChipsContainer>
      )}
      <AddFileButton variant="contained" color="secondary" size="medium" onClick={handleClick} disabled={files.length >= MAX_FILES}>
        {addFileLabel}
      </AddFileButton>
      {sizeError && <ErrorText>{sizeError}</ErrorText>}
      {error && <ErrorText>{error}</ErrorText>}
    </FileUploadContainer>
  )
}

export { FileUpload }
