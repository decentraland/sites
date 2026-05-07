/* eslint-disable @typescript-eslint/naming-convention */
import { useRef, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import { useCastTranslation } from '../../../features/media/cast/useCastTranslation'
import {
  BrowseButton,
  CloseButton,
  Divider,
  ErrorText,
  Modal,
  Overlay,
  ShareButton,
  SupportedFormats,
  Title,
  UrlInput,
  UrlRow
} from './SharePresentationModal.styled'

interface SharePresentationModalProps {
  onClose: () => void
  onFileSelected: (file: File) => void
  onUrlSubmitted: (url: string) => void
}

const MAX_FILE_SIZE_MB = 100
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// Accept by extension *and* MIME (when the browser provides one). Some browsers
// return an empty `file.type` for .pptx, so extension alone must be sufficient,
// but a mismatched non-empty MIME is always rejected to block renamed files.
const VALID_EXT_REGEX = /\.(pdf|pptx)$/i
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'])

export function SharePresentationModal({ onClose, onFileSelected, onUrlSubmitted }: SharePresentationModalProps) {
  const { t } = useCastTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const handleBrowse = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(t('streaming_controls.file_too_large', { maxMb: String(MAX_FILE_SIZE_MB) }))
      return
    }
    if (!VALID_EXT_REGEX.test(file.name) || (file.type && !ALLOWED_MIME_TYPES.has(file.type))) {
      setFileError(t('streaming_controls.file_invalid_type'))
      return
    }
    setFileError(null)
    onFileSelected(file)
    onClose()
  }

  const handleShareUrl = () => {
    const trimmed = url.trim()
    if (!trimmed) return
    let parsed: URL
    try {
      parsed = new URL(trimmed)
    } catch {
      setUrlError(t('streaming_controls.url_invalid'))
      return
    }
    if (parsed.protocol !== 'https:') {
      setUrlError(t('streaming_controls.url_https_required'))
      return
    }
    setUrlError(null)
    onUrlSubmitted(trimmed)
    onClose()
  }

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value)
    if (urlError) setUrlError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleShareUrl()
    }
  }

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <Overlay onClick={handleOverlayClick}>
      <Modal>
        <CloseButton onClick={onClose}>
          <CloseIcon />
        </CloseButton>

        <Title>{t('streaming_controls.share_presentation')}</Title>

        <UrlRow>
          <UrlInput
            placeholder={t('streaming_controls.paste_presentation_url')}
            value={url}
            onChange={handleUrlChange}
            onKeyDown={handleKeyDown}
          />
          <ShareButton onClick={handleShareUrl} disabled={!url.trim()}>
            {t('streaming_controls.share')}
          </ShareButton>
        </UrlRow>

        {urlError && <ErrorText>{urlError}</ErrorText>}

        <Divider>{t('streaming_controls.or')}</Divider>

        <BrowseButton onClick={handleBrowse}>{t('streaming_controls.browse_local_files')}</BrowseButton>
        <input ref={fileInputRef} type="file" accept=".pdf,.pptx" style={{ display: 'none' }} onChange={handleFileChange} />

        {fileError && <ErrorText>{fileError}</ErrorText>}

        <SupportedFormats>{t('streaming_controls.supported_formats')}</SupportedFormats>
      </Modal>
    </Overlay>
  )
}
