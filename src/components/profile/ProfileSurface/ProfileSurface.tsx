import { useCallback, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useProfileAvatar } from '../../../hooks/useProfileAvatar'
import { AssetsTab, CommunitiesTab, CreationsTab, OverviewTab, PhotosTab, PlacesTab, ReferralRewardsTab } from '../../../pages/profile/tabs'
import { AvatarRender } from '../AvatarRender'
import { ProfileHeader } from '../ProfileHeader'
import { ProfileLayout } from '../ProfileLayout'
import { ProfileMobileMenu } from '../ProfileMobileMenu'
import { ProfileTabs, isTabAvailable, useProfileTabAvailability } from '../ProfileTabs'
import type { ProfileTab } from '../ProfileTabs'

interface ProfileSurfaceProps {
  /** Lowercased Ethereum address (already validated). */
  address: string
  isOwnProfile: boolean
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
  /** Close handler — only the modal mount needs this; the standalone route omits it so no X renders. */
  onClose?: () => void
  /** When set, a back chevron renders in the header. Used when this surface is mounted on top of another modal. */
  onBack?: () => void
  /** When true, render Helmet title (only the route-level mount should do this — modals shouldn't override page title). */
  manageDocumentTitle?: boolean
  /** When true, drops the outer chrome (gradient bg + card frame) so the surface can be embedded in another modal. */
  embedded?: boolean
}

function renderTabContent(tab: ProfileTab, address: string, isOwnProfile: boolean) {
  switch (tab) {
    case 'overview':
      return <OverviewTab address={address} isOwnProfile={isOwnProfile} />
    case 'assets':
      return <AssetsTab address={address} />
    case 'creations':
      return <CreationsTab address={address} isOwnProfile={isOwnProfile} />
    case 'communities':
      return <CommunitiesTab address={address} isOwnProfile={isOwnProfile} />
    case 'places':
      return <PlacesTab address={address} isOwnProfile={isOwnProfile} />
    case 'photos':
      return <PhotosTab address={address} isOwnProfile={isOwnProfile} />
    case 'referral-rewards':
      return <ReferralRewardsTab address={address} />
  }
}

function ProfileSurface({
  address,
  isOwnProfile,
  activeTab,
  onTabChange,
  onClose,
  onBack,
  manageDocumentTitle,
  embedded
}: ProfileSurfaceProps) {
  const t = useFormatMessage()
  const { hidden } = useProfileTabAvailability(address, isOwnProfile)
  const { name: avatarName } = useProfileAvatar(address)
  const visibleTab: ProfileTab = isTabAvailable(activeTab, isOwnProfile) ? activeTab : 'overview'
  const resolvedTab: ProfileTab = hidden.has(visibleTab) ? 'overview' : visibleTab
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)
  const openMobileMenu = useCallback(() => setMobileMenuOpen(true), [])
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  // Direct URL hits on a now-empty tab should rewrite the location, not just swap content.
  useEffect(() => {
    if (resolvedTab !== activeTab) onTabChange(resolvedTab)
  }, [resolvedTab, activeTab, onTabChange])

  // Wearable preview is anchored to Overview only; on other tabs the right
  // column slides over the aside (animated in ProfileLayout.styled).
  const aside = <AvatarRender address={address} />
  const showAside = resolvedTab === 'overview'

  return (
    <>
      <ProfileLayout
        header={
          <ProfileHeader address={address} isOwnProfile={isOwnProfile} onClose={onClose} onBack={onBack} onOpenMenu={openMobileMenu} />
        }
        tabs={<ProfileTabs activeTab={resolvedTab} isOwnProfile={isOwnProfile} onTabSelect={onTabChange} hiddenTabs={hidden} />}
        aside={aside}
        showAside={showAside}
        embedded={embedded}
      >
        {manageDocumentTitle ? (
          <Helmet>
            <title>{`${t('profile.tabs.overview')} | Decentraland`}</title>
          </Helmet>
        ) : null}
        {renderTabContent(resolvedTab, address, isOwnProfile)}
      </ProfileLayout>
      <ProfileMobileMenu
        open={isMobileMenuOpen}
        onClose={closeMobileMenu}
        address={address}
        displayName={avatarName || address}
        isOwnProfile={isOwnProfile}
        activeTab={resolvedTab}
        onTabSelect={onTabChange}
        hiddenTabs={hidden}
      />
    </>
  )
}

export { ProfileSurface }
export type { ProfileSurfaceProps }
