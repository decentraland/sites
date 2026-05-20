import { useCallback, useEffect, useState } from 'react'
import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { CommunityDetailSurface } from '../../profile/CommunityDetailModal'
import { PhotoSurface } from '../../profile/PhotoModal/PhotoSurface'
import { PlaceDetailSurface } from '../../profile/PlaceDetailModal/PlaceDetailSurface'
import { ModalProfileNavigationProvider } from '../../profile/ProfileModal'
import { ProfileSurface } from '../../profile/ProfileSurface'
import type { ProfileTab } from '../../profile/ProfileTabs'
import { StyledDialog } from '../DetailModal/DetailModal.styled'
import { EventDetailModalContent } from './EventDetailModalContent'
import { EventDetailModalHero } from './EventDetailModalHero'
import type { EventDetailModalProps } from './EventDetailModal.types'

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

function EventDetailModal({ open, onClose, data, adminActions, onEdit }: EventDetailModalProps) {
  const [profileAddress, setProfileAddress] = useState<string | null>(null)
  const [profileTab, setProfileTab] = useState<ProfileTab>('overview')
  // Photos / places / communities opened from inside the embedded profile swap in-place — never
  // stack on top of the event dialog. View states: event → profile → (photo | place | community),
  // with the back chevron traversing back one level at a time.
  const [photoId, setPhotoId] = useState<string | null>(null)
  const [place, setPlace] = useState<ProfilePlace | null>(null)
  const [communityId, setCommunityId] = useState<string | null>(null)
  const { address: viewerAddress } = useAuthIdentity()

  // Reset profile view whenever the underlying event changes or the modal closes,
  // so reopening the modal lands back on the event content.
  useEffect(() => {
    if (!open || !data) {
      setProfileAddress(null)
      setPhotoId(null)
      setPlace(null)
      setCommunityId(null)
    }
  }, [open, data])
  useEffect(() => {
    setProfileAddress(null)
    setProfileTab('overview')
    setPhotoId(null)
    setPlace(null)
    setCommunityId(null)
  }, [data?.id])

  const handleOpenProfile = useCallback((address: string) => {
    if (!ADDRESS_REGEX.test(address)) return
    setProfileAddress(address.toLowerCase())
    setProfileTab('overview')
    setPhotoId(null)
    setPlace(null)
    setCommunityId(null)
  }, [])

  const handleOpenPhoto = useCallback((imageId: string) => {
    if (!imageId) return
    setPlace(null)
    setCommunityId(null)
    setPhotoId(imageId)
  }, [])

  const handleOpenPlace = useCallback((nextPlace: ProfilePlace) => {
    setPhotoId(null)
    setCommunityId(null)
    setPlace(nextPlace)
  }, [])

  const handleOpenCommunity = useCallback((id: string) => {
    setPhotoId(null)
    setPlace(null)
    setCommunityId(id)
  }, [])

  const handleBackToEvent = useCallback(() => {
    setProfileAddress(null)
    setPhotoId(null)
    setPlace(null)
    setCommunityId(null)
  }, [])

  const handleBackToProfile = useCallback(() => {
    setPhotoId(null)
    setPlace(null)
    setCommunityId(null)
  }, [])

  const showingProfile = profileAddress !== null
  const showingPhoto = photoId !== null
  const showingPlace = place !== null
  const showingCommunity = communityId !== null
  const isOwnProfile = Boolean(showingProfile && viewerAddress && profileAddress === viewerAddress.toLowerCase())
  const swapVariant: 'profile' | 'photo' | 'place' | 'community' | undefined = showingPhoto
    ? 'photo'
    : showingPlace
      ? 'place'
      : showingCommunity
        ? 'community'
        : showingProfile
          ? 'profile'
          : undefined

  return (
    <StyledDialog
      open={open && !!data}
      onClose={onClose}
      aria-labelledby="event-detail-title"
      fullWidth
      maxWidth={false}
      $wide={swapVariant !== undefined}
      $swapVariant={swapVariant}
    >
      {data && (
        <ModalProfileNavigationProvider
          onOpenProfile={handleOpenProfile}
          onOpenPhoto={handleOpenPhoto}
          onOpenPlace={handleOpenPlace}
          onOpenCommunity={handleOpenCommunity}
        >
          {showingPhoto && photoId ? (
            <PhotoSurface imageId={photoId} onBack={handleBackToProfile} onClose={onClose} />
          ) : showingPlace && place ? (
            <PlaceDetailSurface place={place} onBack={handleBackToProfile} onClose={onClose} />
          ) : showingCommunity && communityId ? (
            <CommunityDetailSurface communityId={communityId} onBack={handleBackToProfile} onClose={onClose} />
          ) : showingProfile && profileAddress ? (
            <ProfileSurface
              embedded
              address={profileAddress}
              isOwnProfile={isOwnProfile}
              activeTab={profileTab}
              onTabChange={setProfileTab}
              onClose={onClose}
              onBack={handleBackToEvent}
            />
          ) : (
            <>
              <EventDetailModalHero data={data} onClose={onClose} onEdit={onEdit} />
              <EventDetailModalContent data={data} adminActions={adminActions} />
            </>
          )}
        </ModalProfileNavigationProvider>
      )}
    </StyledDialog>
  )
}

export { EventDetailModal }
