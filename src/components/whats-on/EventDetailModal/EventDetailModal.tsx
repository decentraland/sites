import { useCallback, useEffect, useState } from 'react'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
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
  const { address: viewerAddress } = useAuthIdentity()

  // Reset profile view whenever the underlying event changes or the modal closes,
  // so reopening the modal lands back on the event content.
  useEffect(() => {
    if (!open || !data) setProfileAddress(null)
  }, [open, data])
  useEffect(() => {
    setProfileAddress(null)
    setProfileTab('overview')
  }, [data?.id])

  const handleOpenProfile = useCallback((address: string) => {
    if (!ADDRESS_REGEX.test(address)) return
    setProfileAddress(address.toLowerCase())
    setProfileTab('overview')
  }, [])

  const handleBackToEvent = useCallback(() => {
    setProfileAddress(null)
  }, [])

  const showingProfile = profileAddress !== null
  const isOwnProfile = Boolean(showingProfile && viewerAddress && profileAddress === viewerAddress.toLowerCase())

  return (
    <StyledDialog
      open={open && !!data}
      onClose={onClose}
      aria-labelledby="event-detail-title"
      fullWidth
      maxWidth={false}
      $wide={showingProfile}
    >
      {data && (
        <ModalProfileNavigationProvider onOpenProfile={handleOpenProfile}>
          {showingProfile && profileAddress ? (
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
