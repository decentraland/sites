import { useCallback, useRef } from 'react'
import type { DragEvent } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import { useTranslation } from '@dcl/hooks'
import {
  CameraIcon,
  ChooseLink,
  DropHintText,
  DropZone,
  DropZoneContent,
  ErrorText,
  HelperIcon,
  HelperRow,
  HelperText,
  IconAndTitle,
  OverlayText,
  PreviewImage,
  PreviewOverlay,
  RecommendedSize,
  SelectText,
  UploadHintGroup
} from './ImageUpload.styled'

type ImageUploadProps = {
  imagePreviewUrl: string | null
  imageError: string | null
  onImageSelect: (file: File) => void
  onImageRemove: () => void
}

function ImageUpload({ imagePreviewUrl, imageError, onImageSelect, onImageRemove }: ImageUploadProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        onImageSelect(file)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [onImageSelect]
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
      if (file) {
        onImageSelect(file)
      }
    },
    [onImageSelect]
  )

  const hasImage = Boolean(imagePreviewUrl)

  return (
    <div>
      <DropZone
        $hasImage={hasImage}
        $hasError={Boolean(imageError)}
        onClick={hasImage ? undefined : handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label={t('create_event.image_upload_label')}
      >
        {imagePreviewUrl ? (
          <>
            <PreviewImage src={imagePreviewUrl} alt={t('create_event.image_preview_alt')} />
            <PreviewOverlay onClick={onImageRemove}>
              <OverlayText>{t('create_event.change_image')}</OverlayText>
            </PreviewOverlay>
          </>
        ) : (
          <DropZoneContent>
            <IconAndTitle>
              <CameraIcon>
                <PhotoCameraIcon sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.5)' }} />
              </CameraIcon>
              <SelectText>{t('create_event.select_cover')}</SelectText>
            </IconAndTitle>
            <UploadHintGroup>
              <DropHintText>
                <ChooseLink onClick={handleClick}>{t('create_event.choose_picture')}</ChooseLink> {t('create_event.drop_hint')}
              </DropHintText>
              <RecommendedSize>{t('create_event.recommended_size')}</RecommendedSize>
            </UploadHintGroup>
          </DropZoneContent>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </DropZone>
      <HelperRow>
        <HelperIcon>
          <InfoOutlinedIcon sx={{ fontSize: 'inherit', color: '#fcfcfc' }} />
        </HelperIcon>
        <HelperText>{t('create_event.image_helper')}</HelperText>
      </HelperRow>
      {imageError && <ErrorText>{imageError}</ErrorText>}
    </div>
  )
}

export { ImageUpload }
export type { ImageUploadProps }
