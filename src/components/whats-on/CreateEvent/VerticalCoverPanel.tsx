import { useCallback, useRef } from 'react'
import type { DragEvent } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import { useTranslation } from '@dcl/hooks'
import type { ImageErrorCode } from '../../../hooks/useCreateEventForm.types'
import { ImageErrorMessage } from './ImageErrorMessage'
import {
  CameraIcon,
  ChooseLink,
  DropZone,
  DropZoneContent,
  HintGroup,
  HintText,
  IconAndTitle,
  OverlayText,
  PanelContainer,
  PreviewImage,
  PreviewOverlay,
  RecommendedSize,
  SelectText
} from './VerticalCoverPanel.styled'

type VerticalCoverPanelProps = {
  previewUrl: string | null
  imageError: ImageErrorCode | null
  onSelect: (file: File) => void
  onRemove: () => void
}

function VerticalCoverPanel({ previewUrl, imageError, onSelect, onRemove }: VerticalCoverPanelProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const hasImage = Boolean(previewUrl)

  const handleClick = useCallback(() => {
    if (hasImage) return
    inputRef.current?.click()
  }, [hasImage])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) onSelect(file)
      if (inputRef.current) inputRef.current.value = ''
    },
    [onSelect]
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      const file = event.dataTransfer.files[0]
      if (file) onSelect(file)
    },
    [onSelect]
  )

  return (
    <PanelContainer>
      <DropZone
        $hasImage={hasImage}
        $hasError={Boolean(imageError)}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label={t('create_event.vertical_modal_label')}
      >
        {previewUrl ? (
          <>
            <PreviewImage src={previewUrl} alt={t('create_event.image_preview_alt')} />
            <PreviewOverlay onClick={onRemove}>
              <OverlayText>{t('create_event.change_image')}</OverlayText>
            </PreviewOverlay>
          </>
        ) : (
          <DropZoneContent>
            <IconAndTitle>
              <CameraIcon>
                <PhotoCameraIcon />
              </CameraIcon>
              <SelectText>{t('create_event.select_vertical_cover')}</SelectText>
            </IconAndTitle>
            <HintGroup>
              <HintText>
                <ChooseLink onClick={handleClick}>{t('create_event.choose_picture')}</ChooseLink> {t('create_event.drop_hint')}
              </HintText>
              <RecommendedSize>{t('create_event.vertical_recommended_size')}</RecommendedSize>
              <RecommendedSize>{t('create_event.vertical_image_usage')}</RecommendedSize>
            </HintGroup>
          </DropZoneContent>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </DropZone>
      {imageError && <ImageErrorMessage code={imageError} />}
    </PanelContainer>
  )
}

export { VerticalCoverPanel }
export type { VerticalCoverPanelProps }
