import { memo, useCallback, useEffect } from 'react'
import { ModalProfileNavigationProvider } from '../ProfileModal/ModalProfileNavigation'
import { ModalSurfaceView } from '../ProfileModal/ModalSurfaceStack'
import { useModalSurfaceStack } from '../ProfileModal/useModalSurfaceStack'
import { PhotoSurface } from './PhotoSurface'
import { PhotoDialog } from './PhotoModal.styled'

interface PhotoModalProps {
  imageId: string | null
  onClose: () => void
}

const PhotoModal = memo(({ imageId, onClose }: PhotoModalProps) => {
  // In-place swaps (rule: never stack a modal on a modal): clicking a creator/people row or
  // another photo from inside the embedded profile pushes onto the surface stack, and the
  // back chevron unwinds one level at a time: photoB → profileX → photoA(root) → close.
  const { top, variant, openProfile, openPhoto, openFriends, pop, reset, setTopProfileTab, exitTopProfileTab } = useModalSurfaceStack()

  // A new root photo (or closing the modal) starts a fresh history.
  useEffect(() => {
    reset()
  }, [imageId, reset])

  // Escape unwinds one surface at a time; backdrop click dismisses the dialog.
  const handleDialogClose = useCallback(
    (_event: object, reason?: string) => {
      if (reason === 'escapeKeyDown' && top) {
        pop()
        return
      }
      onClose()
    },
    [top, pop, onClose]
  )

  return (
    <PhotoDialog
      open={imageId !== null}
      onClose={handleDialogClose}
      maxWidth={false}
      aria-labelledby="photo-modal-title"
      $variant={variant === 'profile' ? 'profile' : 'photo'}
    >
      {imageId !== null ? (
        <ModalProfileNavigationProvider onOpenProfile={openProfile} onOpenPhoto={openPhoto} onOpenFriends={openFriends}>
          {top ? (
            <ModalSurfaceView surface={top} onBack={pop} onClose={onClose} onTabChange={setTopProfileTab} onExitTab={exitTopProfileTab} />
          ) : (
            <PhotoSurface imageId={imageId} onClose={onClose} />
          )}
        </ModalProfileNavigationProvider>
      ) : null}
    </PhotoDialog>
  )
})

PhotoModal.displayName = 'PhotoModal'

export { PhotoModal }
export type { PhotoModalProps }
