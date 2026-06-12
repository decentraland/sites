import { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { useTabletAndBelowMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useProfileAvatar } from '../../../hooks/useProfileAvatar'
import { AssetsTab, CommunitiesTab, CreationsTab, OverviewTab, PhotosTab, PlacesTab, ReferralRewardsTab } from '../../../pages/profile/tabs'
import { getDisplayName } from '../../../utils/avatarColor'
import { AvatarRender } from '../AvatarRender'
import { ProfileHeader } from '../ProfileHeader'
import { ProfileLayout } from '../ProfileLayout'
import { ProfileMobileNav } from '../ProfileMobileMenu'
import { ProfileTabs, getVisibleTabs, isTabAvailable, useProfileTabAvailability } from '../ProfileTabs'
import type { ProfileTab } from '../ProfileTabs'
import { MobileTabHeader } from './MobileTabHeader'

interface ProfileSurfaceProps {
  /** Lowercased Ethereum address (already validated). */
  address: string
  isOwnProfile: boolean
  activeTab: ProfileTab
  onTabChange: (tab: ProfileTab) => void
  /**
   * True when the mount carries an explicit tab choice (URL segment / modal swap). On mobile,
   * its absence renders the navigation root screen (Figma 167:85610 / 322:49246) instead of a tab.
   */
  hasExplicitTab?: boolean
  /** Returns to the mobile navigation root (clears the tab choice). */
  onExitTab?: () => void
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
  hasExplicitTab = true,
  onExitTab,
  onClose,
  onBack,
  manageDocumentTitle,
  embedded
}: ProfileSurfaceProps) {
  const t = useFormatMessage()
  const isMobile = useTabletAndBelowMediaQuery()
  const { hidden, isReady } = useProfileTabAvailability(address, isOwnProfile)
  const { name: avatarName, avatar } = useProfileAvatar(address)
  // "<displayName> | Decentraland" — unclaimed names get the #1234 suffix (ADR-292's
  // getDisplayName). Empty while the profile loads → fall back to the generic title.
  const documentTitle = `${
    getDisplayName({ name: avatarName, hasClaimedName: avatar?.hasClaimedName, ethAddress: avatar?.ethAddress ?? address }) ||
    t('profile.tabs.overview')
  } | Decentraland`
  const visibleTab: ProfileTab = isTabAvailable(activeTab, isOwnProfile) ? activeTab : 'overview'
  // While the availability probes are still in flight every data tab sits in `hidden`, so
  // redirecting immediately would bounce ALL deep links to overview. Render the requested
  // tab optimistically (it owns its loading state) and only redirect once the probes
  // confirmed the tab is truly empty.
  const resolvedTab: ProfileTab = isReady && hidden.has(visibleTab) ? 'overview' : visibleTab
  // Mobile uses hierarchical navigation (Figma member/my mobile flows): the root screen is a
  // full-width section list and each tab renders as its own sub-screen with a breadcrumb.
  const showMobileRoot = isMobile && !hasExplicitTab

  // Direct URL hits on a confirmed-empty tab should rewrite the location, not just swap content.
  useEffect(() => {
    if (!showMobileRoot && isReady && resolvedTab !== activeTab) onTabChange(resolvedTab)
  }, [showMobileRoot, isReady, resolvedTab, activeTab, onTabChange])

  const activeTabLabel = useMemo(() => {
    const config = getVisibleTabs(isOwnProfile).find(tab => tab.id === resolvedTab)
    return config ? t(config.labelKey) : t('profile.tabs.overview')
  }, [isOwnProfile, resolvedTab, t])

  // Wearable preview is anchored to Overview only; on other tabs the right
  // column slides over the aside (animated in ProfileLayout.styled).
  const aside = <AvatarRender address={address} />
  const showAside = !showMobileRoot && resolvedTab === 'overview'

  const header = isMobile ? (
    showMobileRoot ? null : (
      <MobileTabHeader label={activeTabLabel} onBack={() => onExitTab?.()} onClose={onClose} />
    )
  ) : (
    <ProfileHeader address={address} isOwnProfile={isOwnProfile} onClose={onClose} onBack={onBack} embedded={embedded} />
  )

  const tabs = isMobile ? undefined : (
    <ProfileTabs activeTab={resolvedTab} isOwnProfile={isOwnProfile} onTabSelect={onTabChange} hiddenTabs={hidden} />
  )

  return (
    <ProfileLayout header={header} tabs={tabs} aside={aside} showAside={showAside} embedded={embedded}>
      {manageDocumentTitle ? (
        <Helmet>
          <title>{documentTitle}</title>
        </Helmet>
      ) : null}
      {showMobileRoot ? (
        <ProfileMobileNav
          address={address}
          displayName={avatarName || address}
          isOwnProfile={isOwnProfile}
          onTabSelect={onTabChange}
          hiddenTabs={hidden}
          onClose={onClose}
        />
      ) : (
        renderTabContent(resolvedTab, address, isOwnProfile)
      )}
    </ProfileLayout>
  )
}

export { ProfileSurface }
export type { ProfileSurfaceProps }
