import { useCallback, useEffect, useState } from 'react'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { ProfileSurface } from '../ProfileSurface'
import type { ProfileTab } from '../ProfileTabs'
import { ModalProfileNavigationProvider } from './ModalProfileNavigation'
import { ModalSurfaceView } from './ModalSurfaceStack'
import { useModalSurfaceStack } from './useModalSurfaceStack'
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
  const rootAddress = address.toLowerCase()
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab)
  // Mobile renders the navigation root until a tab is explicitly chosen; opening the modal
  // straight into a non-overview tab (photo flows) counts as an explicit choice.
  const [hasChosenTab, setHasChosenTab] = useState(initialTab !== 'overview')
  // Photos / places / communities / other profiles opened from inside this modal swap
  // in-place (rule: never stack a modal on a modal). The surface stack keeps the full
  // history so back unwinds one level at a time instead of jumping to this root profile.
  const { top, variant, openProfile, openPhoto, openPlace, openCommunity, openFriends, pop, reset, setTopProfileTab, exitTopProfileTab } =
    useModalSurfaceStack()

  // Opening a different root profile (or re-opening the modal) starts a fresh history.
  useEffect(() => {
    reset()
    setActiveTab(initialTab)
    setHasChosenTab(initialTab !== 'overview')
  }, [rootAddress, open, initialTab, reset])

  const handleOpenProfile = useCallback(
    (nextAddress: string) => {
      // The root profile is already visible — only deeper navigation creates history.
      if (nextAddress.toLowerCase() === rootAddress && !top) return
      openProfile(nextAddress)
    },
    [rootAddress, top, openProfile]
  )
  // Escape unwinds one surface at a time; only at the root (or via backdrop click,
  // which always means "dismiss") does it close the whole dialog.
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
  const handleRootTabChange = useCallback((nextTab: ProfileTab) => {
    setActiveTab(nextTab)
    setHasChosenTab(true)
  }, [])
  const handleRootExitTab = useCallback(() => {
    setActiveTab('overview')
    setHasChosenTab(false)
  }, [])

  if (!isValidAddress(rootAddress)) {
    return null
  }
  const isOwnProfile = Boolean(viewerAddress && rootAddress === viewerAddress.toLowerCase())

  return (
    <ProfileDialog open={open} onClose={handleDialogClose} fullWidth maxWidth={false} scroll="paper" $variant={variant ?? 'profile'}>
      <ModalProfileNavigationProvider
        onOpenProfile={handleOpenProfile}
        onOpenPhoto={openPhoto}
        onOpenPlace={openPlace}
        onOpenCommunity={openCommunity}
        onOpenFriends={openFriends}
      >
        {top ? (
          <ModalSurfaceView surface={top} onBack={pop} onClose={onClose} onTabChange={setTopProfileTab} onExitTab={exitTopProfileTab} />
        ) : (
          <ProfileSurface
            address={rootAddress}
            isOwnProfile={isOwnProfile}
            activeTab={activeTab}
            onTabChange={handleRootTabChange}
            hasExplicitTab={hasChosenTab}
            onExitTab={handleRootExitTab}
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
