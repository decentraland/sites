import { memo, useCallback, useState } from 'react'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { ModalProfileNavigationProvider } from '../ProfileModal/ModalProfileNavigation'
import { ProfileSurface } from '../ProfileSurface'
import type { ProfileTab } from '../ProfileTabs'
import { PhotoSurface } from './PhotoSurface'
import { PhotoDialog } from './PhotoModal.styled'

interface PhotoModalProps {
  imageId: string | null
  onClose: () => void
}

const PhotoModal = memo(({ imageId, onClose }: PhotoModalProps) => {
  const { address: viewerAddress } = useAuthIdentity()
  // In-place swap targets (rule: never stack a modal on a modal).
  //   - viewingProfileAddress: click on a creator/people row → swap to ProfileSurface
  //   - viewingImageId: click on another photo from inside the embedded profile's
  //     Photos tab → swap THIS modal to that new PhotoSurface (no nested PhotoModal)
  // Back chevron unwinds the stack: photoB → profileX → photoA(root) → close.
  const [viewingProfileAddress, setViewingProfileAddress] = useState<string | null>(null)
  const [profileTab, setProfileTab] = useState<ProfileTab>('overview')
  const [viewingImageId, setViewingImageId] = useState<string | null>(null)

  const handleOpenProfile = useCallback((address: string) => {
    setViewingImageId(null)
    setViewingProfileAddress(address.toLowerCase())
    setProfileTab('overview')
  }, [])

  const handleOpenPhoto = useCallback((nextImageId: string) => {
    setViewingImageId(nextImageId)
  }, [])

  const handleBackFromProfile = useCallback(() => setViewingProfileAddress(null), [])
  const handleBackFromPhoto = useCallback(() => setViewingImageId(null), [])

  const activeImageId = viewingImageId ?? imageId
  const variant: 'photo' | 'profile' = viewingImageId === null && viewingProfileAddress ? 'profile' : 'photo'
  const isOwnProfile = Boolean(viewingProfileAddress && viewerAddress && viewingProfileAddress === viewerAddress.toLowerCase())

  let body: React.ReactNode = null
  if (imageId !== null) {
    if (viewingImageId !== null && activeImageId !== null) {
      // Stack: photoA(root) → profileX → photoB. Back returns to profileX.
      body = <PhotoSurface imageId={activeImageId} onClose={onClose} onBack={handleBackFromPhoto} />
    } else if (viewingProfileAddress) {
      body = (
        <ProfileSurface
          embedded
          address={viewingProfileAddress}
          isOwnProfile={isOwnProfile}
          activeTab={profileTab}
          onTabChange={setProfileTab}
          onBack={handleBackFromProfile}
          onClose={onClose}
        />
      )
    } else {
      body = <PhotoSurface imageId={imageId} onClose={onClose} />
    }
  }

  return (
    <PhotoDialog open={imageId !== null} onClose={onClose} maxWidth={false} aria-labelledby="photo-modal-title" $variant={variant}>
      {body !== null ? (
        <ModalProfileNavigationProvider onOpenProfile={handleOpenProfile} onOpenPhoto={handleOpenPhoto}>
          {body}
        </ModalProfileNavigationProvider>
      ) : null}
    </PhotoDialog>
  )
})

PhotoModal.displayName = 'PhotoModal'

export { PhotoModal }
export type { PhotoModalProps }
