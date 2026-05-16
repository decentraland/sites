import { useCallback, useState } from 'react'
import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { CommunityDetailSurface } from '../CommunityDetailModal'
import { PhotoSurface } from '../PhotoModal/PhotoSurface'
import { PlaceDetailSurface } from '../PlaceDetailModal/PlaceDetailSurface'
import { ProfileSurface } from '../ProfileSurface'
import type { ProfileTab } from '../ProfileTabs'
import { ModalProfileNavigationProvider } from './ModalProfileNavigation'
import { ProfileDialog } from './ProfileModal.styled'

interface ProfileModalProps {
  address: string
  open: boolean
  onClose: () => void
  /** When set, a back chevron replaces no-op for stack-on-top scenarios (e.g. opened from inside the event modal). */
  onBack?: () => void
  initialTab?: ProfileTab
}

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

function isValidAddress(value: string | undefined): value is `0x${string}` {
  return Boolean(value && ADDRESS_REGEX.test(value))
}

function ProfileModal({ address, open, onClose, onBack, initialTab = 'overview' }: ProfileModalProps) {
  const { address: viewerAddress } = useAuthIdentity()
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab)
  // Photos / places / communities opened from inside this modal swap in-place
  // (rule: never stack a modal on a modal). The back chevron returns to the profile while
  // `onClose` still dismisses the whole dialog.
  const [viewingPhotoId, setViewingPhotoId] = useState<string | null>(null)
  const [viewingPlace, setViewingPlace] = useState<ProfilePlace | null>(null)
  const [viewingCommunityId, setViewingCommunityId] = useState<string | null>(null)
  // Address swapping while staying in the same dialog — mirrors the event modal pattern so
  // jumping between profiles never opens nested dialogs.
  const [shownAddress, setShownAddress] = useState(address.toLowerCase())

  const handleOpenProfile = useCallback((nextAddress: string) => {
    setViewingPhotoId(null)
    setViewingPlace(null)
    setViewingCommunityId(null)
    setShownAddress(nextAddress.toLowerCase())
    setActiveTab('overview')
  }, [])
  const handleOpenPhoto = useCallback((imageId: string) => {
    setViewingPlace(null)
    setViewingCommunityId(null)
    setViewingPhotoId(imageId)
  }, [])
  const handleOpenPlace = useCallback((place: ProfilePlace) => {
    setViewingPhotoId(null)
    setViewingCommunityId(null)
    setViewingPlace(place)
  }, [])
  const handleOpenCommunity = useCallback((communityId: string) => {
    setViewingPhotoId(null)
    setViewingPlace(null)
    setViewingCommunityId(communityId)
  }, [])
  const handleBackFromPhoto = useCallback(() => setViewingPhotoId(null), [])
  const handleBackFromPlace = useCallback(() => setViewingPlace(null), [])
  const handleBackFromCommunity = useCallback(() => setViewingCommunityId(null), [])

  if (!isValidAddress(shownAddress)) {
    return null
  }
  const isOwnProfile = Boolean(viewerAddress && shownAddress === viewerAddress.toLowerCase())

  return (
    <ProfileDialog open={open} onClose={onClose} fullWidth maxWidth={false} scroll="paper">
      <ModalProfileNavigationProvider
        onOpenProfile={handleOpenProfile}
        onOpenPhoto={handleOpenPhoto}
        onOpenPlace={handleOpenPlace}
        onOpenCommunity={handleOpenCommunity}
      >
        {viewingPhotoId ? (
          <PhotoSurface imageId={viewingPhotoId} onBack={handleBackFromPhoto} onClose={onClose} />
        ) : viewingPlace ? (
          <PlaceDetailSurface place={viewingPlace} onBack={handleBackFromPlace} onClose={onClose} />
        ) : viewingCommunityId ? (
          <CommunityDetailSurface communityId={viewingCommunityId} onBack={handleBackFromCommunity} onClose={onClose} />
        ) : (
          <ProfileSurface
            address={shownAddress}
            isOwnProfile={isOwnProfile}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={onClose}
            onBack={onBack}
            embedded
          />
        )}
      </ModalProfileNavigationProvider>
    </ProfileDialog>
  )
}

export { ProfileModal }
export type { ProfileModalProps }
