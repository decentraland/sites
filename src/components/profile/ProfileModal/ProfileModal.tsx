import { useState } from 'react'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { ProfileSurface } from '../ProfileSurface'
import type { ProfileTab } from '../ProfileTabs'
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

  if (!isValidAddress(address)) {
    return null
  }
  const normalizedAddress = address.toLowerCase()
  const isOwnProfile = Boolean(viewerAddress && normalizedAddress === viewerAddress.toLowerCase())

  return (
    <ProfileDialog open={open} onClose={onClose} fullWidth maxWidth={false} scroll="paper">
      <ProfileSurface
        address={normalizedAddress}
        isOwnProfile={isOwnProfile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={onClose}
        onBack={onBack}
        embedded
      />
    </ProfileDialog>
  )
}

export { ProfileModal }
export type { ProfileModalProps }
