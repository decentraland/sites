import { memo, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ProfileAvatar } from '../ProfileAvatar'
import { getVisibleTabs } from '../ProfileTabs'
import type { ProfileTab } from '../ProfileTabs'
import {
  DrawerHeader,
  DrawerIconButton,
  MobileDrawer,
  TabChevron,
  TabItem,
  TabList,
  UserAddress,
  UserBlock,
  UserName
} from './ProfileMobileMenu.styled'

interface ProfileMobileMenuProps {
  open: boolean
  onClose: () => void
  address: string
  displayName: string
  isOwnProfile: boolean
  activeTab: ProfileTab
  onTabSelect: (tab: ProfileTab) => void
  /** Tabs hidden by `useProfileTabAvailability`. The drawer applies the same filter as the desktop nav. */
  hiddenTabs?: Set<ProfileTab>
}

function shortenAddress(value: string): string {
  if (value.length < 12) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

const ProfileMobileMenu = memo(
  ({ open, onClose, address, displayName, isOwnProfile, activeTab, onTabSelect, hiddenTabs }: ProfileMobileMenuProps) => {
    const t = useFormatMessage()
    const tabs = useMemo(() => {
      const all = getVisibleTabs(isOwnProfile)
      if (!hiddenTabs || hiddenTabs.size === 0) return all
      return all.filter(tab => !hiddenTabs.has(tab.id))
    }, [isOwnProfile, hiddenTabs])

    return (
      <MobileDrawer anchor="left" open={open} onClose={onClose}>
        <DrawerHeader>
          <DrawerIconButton aria-label="Back" onClick={onClose}>
            <ArrowBackIosNewIcon fontSize="small" />
          </DrawerIconButton>
          <DrawerIconButton aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </DrawerIconButton>
        </DrawerHeader>
        <UserBlock>
          <ProfileAvatar address={address} size={64} />
          <UserName>{displayName}</UserName>
          <UserAddress>{shortenAddress(address)}</UserAddress>
        </UserBlock>
        <TabList>
          {tabs.map(tab => (
            <TabItem
              key={tab.id}
              type="button"
              $active={tab.id === activeTab}
              onClick={() => {
                onTabSelect(tab.id)
                onClose()
              }}
            >
              {t(tab.labelKey)}
              <TabChevron>
                <ChevronRightIcon fontSize="small" />
              </TabChevron>
            </TabItem>
          ))}
        </TabList>
      </MobileDrawer>
    )
  }
)

export { ProfileMobileMenu }
export type { ProfileMobileMenuProps }
