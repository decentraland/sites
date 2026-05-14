import { memo } from 'react'
import { PhotoSurface } from './PhotoSurface'
import { PhotoDialog } from './PhotoModal.styled'

interface PhotoModalProps {
  imageId: string | null
  onClose: () => void
}

const PhotoModal = memo(({ imageId, onClose }: PhotoModalProps) => (
  <PhotoDialog open={imageId !== null} onClose={onClose} maxWidth={false} aria-labelledby="photo-modal-title">
    {imageId !== null ? <PhotoSurface imageId={imageId} onClose={onClose} /> : null}
  </PhotoDialog>
))

export { PhotoModal }
export type { PhotoModalProps }
