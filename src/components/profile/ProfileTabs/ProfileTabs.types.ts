type ProfileTab = 'overview' | 'assets' | 'creations' | 'communities' | 'places' | 'photos' | 'referral-rewards'

type ProfileTabVisibility = 'member' | 'me' | 'all'

interface ProfileTabConfig {
  id: ProfileTab
  memberLabelKey: string | null
  myLabelKey: string | null
  visibleFor: ProfileTabVisibility
}

interface ProfileTabsProps {
  activeTab: ProfileTab
  isOwnProfile: boolean
  onTabSelect: (tab: ProfileTab) => void
  /** Tabs to omit from the nav (e.g. dynamically hidden when the underlying data is empty). */
  hiddenTabs?: Set<ProfileTab>
}

// Tabs differ Member vs My (per Figma 167:77288 + 322:49164):
// - Member (5): Overview, Creations, Communities, Places, Photos
// - My (6): Overview, MY ASSETS, MY COMMUNITIES, MY PLACES, MY PHOTOS, REFERRAL REWARDS
// Note: "Creations" only exists for Member (people see what others built); "Assets" only for My.
const ALL_PROFILE_TABS: ProfileTabConfig[] = [
  { id: 'overview', memberLabelKey: 'profile.tabs.overview', myLabelKey: 'profile.tabs.overview', visibleFor: 'all' },
  { id: 'assets', memberLabelKey: null, myLabelKey: 'profile.tabs.my_assets', visibleFor: 'me' },
  { id: 'creations', memberLabelKey: 'profile.tabs.creations', myLabelKey: null, visibleFor: 'member' },
  { id: 'communities', memberLabelKey: 'profile.tabs.communities', myLabelKey: 'profile.tabs.my_communities', visibleFor: 'all' },
  { id: 'places', memberLabelKey: 'profile.tabs.places', myLabelKey: 'profile.tabs.my_places', visibleFor: 'all' },
  { id: 'photos', memberLabelKey: 'profile.tabs.photos', myLabelKey: 'profile.tabs.my_photos', visibleFor: 'all' },
  { id: 'referral-rewards', memberLabelKey: null, myLabelKey: 'profile.tabs.referral_rewards', visibleFor: 'me' }
]

function getVisibleTabs(isOwnProfile: boolean): { id: ProfileTab; labelKey: string }[] {
  return ALL_PROFILE_TABS.flatMap(tab => {
    if (tab.visibleFor === 'me' && !isOwnProfile) return []
    if (tab.visibleFor === 'member' && isOwnProfile) return []
    const labelKey = isOwnProfile ? tab.myLabelKey : tab.memberLabelKey
    if (!labelKey) return []
    return [{ id: tab.id, labelKey }]
  })
}

function isTabAvailable(tab: ProfileTab, isOwnProfile: boolean): boolean {
  return getVisibleTabs(isOwnProfile).some(entry => entry.id === tab)
}

export { ALL_PROFILE_TABS, getVisibleTabs, isTabAvailable }
export type { ProfileTab, ProfileTabConfig, ProfileTabsProps, ProfileTabVisibility }
