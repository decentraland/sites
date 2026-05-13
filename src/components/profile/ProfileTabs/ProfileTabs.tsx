import { useCallback, useMemo } from 'react'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { getVisibleTabs } from './ProfileTabs.types'
import type { ProfileTab, ProfileTabsProps } from './ProfileTabs.types'
import { StyledTab, StyledTabs } from './ProfileTabs.styled'

function ProfileTabs({ activeTab, isOwnProfile, onTabSelect }: ProfileTabsProps) {
  const t = useFormatMessage()
  const tabs = useMemo(() => getVisibleTabs(isOwnProfile), [isOwnProfile])

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, value: ProfileTab) => {
      onTabSelect(value)
    },
    [onTabSelect]
  )

  // Defensive default: if the active tab isn't visible for this viewer (e.g. a Member
  // visitor landed on /profile/<other>/assets via deep link), fall back to overview
  // for the highlight instead of triggering MUI's "value out of range" warning.
  const safeValue: ProfileTab = tabs.some(tab => tab.id === activeTab) ? activeTab : 'overview'

  return (
    <StyledTabs value={safeValue} onChange={handleChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
      {tabs.map(tab => (
        <StyledTab key={tab.id} value={tab.id} label={t(tab.labelKey)} />
      ))}
    </StyledTabs>
  )
}

export { ProfileTabs }
export type { ProfileTabsProps }
