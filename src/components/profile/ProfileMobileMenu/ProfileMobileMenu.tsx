import { memo, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
// eslint-disable-next-line @typescript-eslint/naming-convention
import LogoutIcon from '@mui/icons-material/Logout'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import { useFriendsCount, useFriendshipStatus, useMutualFriends, useUpsertFriendship } from '../../../features/profile/profile.social.rpc'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useWalletAddress } from '../../../hooks/useWalletAddress'
import { getAvatarBackgroundColor, getDisplayName } from '../../../utils/avatarColor'
import { FriendsModal } from '../FriendsModal'
import { ProfileAvatar } from '../ProfileAvatar'
import { getFriendButtonConfig } from '../ProfileHeader/ProfileHeader.helpers'
import { getVisibleTabs } from '../ProfileTabs'
import type { ProfileTab } from '../ProfileTabs'
import { TAB_ICONS } from './ProfileMobileMenu.icons'
import {
  AddressCopyButton,
  CtaRow,
  DrawerCta,
  DrawerHeader,
  DrawerIconButton,
  LogoutButton,
  MobileDrawer,
  MutualDot,
  MutualRow,
  MutualSlot,
  MutualStack,
  SectionDivider,
  TabChevron,
  TabItem,
  TabLabel,
  TabLeading,
  TabList,
  UserAddressRow,
  UserAddressText,
  UserBlock,
  UserName,
  UserNameColumn
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
    const { hasValidIdentity } = useAuthIdentity()
    const { disconnect } = useWalletAddress()
    const navigate = useNavigate()
    const canQueryFriendship = !isOwnProfile && hasValidIdentity
    const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false)
    const [hasCopiedInvite, setHasCopiedInvite] = useState(false)

    const { status: friendshipStatus, isLoading: isLoadingFriendship } = useFriendshipStatus(canQueryFriendship ? address : undefined)
    const { upsert: upsertFriendship, isLoading: isUpdatingFriendship } = useUpsertFriendship()
    const { count: mutualCount, friends: mutualFriendsPreview } = useMutualFriends(canQueryFriendship ? address : undefined)
    const { count: friendsCount } = useFriendsCount()

    const mutualSlots = useMemo(
      () =>
        Array.from({ length: Math.min(3, mutualCount) }, (_, idx) => {
          const friend = mutualFriendsPreview[idx]
          const seed = friend
            ? getDisplayName({ name: friend.name, hasClaimedName: friend.hasClaimedName, ethAddress: friend.address })
            : ''
          return {
            address: friend?.address,
            color: getAvatarBackgroundColor(seed || `${address}-${idx}`)
          }
        }),
      [address, mutualCount, mutualFriendsPreview]
    )

    const tabs = useMemo(() => {
      const all = getVisibleTabs(isOwnProfile)
      if (!hiddenTabs || hiddenTabs.size === 0) return all
      return all.filter(tab => !hiddenTabs.has(tab.id))
    }, [isOwnProfile, hiddenTabs])

    const handleCopyAddress = useCallback(() => {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        void navigator.clipboard.writeText(address)
      }
    }, [address])

    const friendButton = useMemo(() => getFriendButtonConfig(friendshipStatus), [friendshipStatus])

    const handleFriendAction = useCallback(() => {
      if (!canQueryFriendship) return
      void upsertFriendship({ address, action: friendButton.action }).catch(() => {
        /* error surfaced via the hook's `error` state */
      })
    }, [address, canQueryFriendship, friendButton.action, upsertFriendship])

    const handleShareProfile = useCallback(() => {
      if (typeof navigator === 'undefined' || !navigator.clipboard || typeof window === 'undefined') return
      const inviteUrl = `${window.location.origin}/invite/${address}`
      void navigator.clipboard.writeText(inviteUrl).then(() => {
        setHasCopiedInvite(true)
        setTimeout(() => setHasCopiedInvite(false), 2000)
      })
    }, [address])

    const handleLogout = useCallback(() => {
      void disconnect()
      onClose()
    }, [disconnect, onClose])

    return (
      <MobileDrawer anchor="right" open={open} onClose={onClose}>
        <DrawerHeader>
          <DrawerIconButton aria-label={t('profile.header.back')} onClick={onClose}>
            <ArrowBackIosNewIcon fontSize="small" />
          </DrawerIconButton>
          <DrawerIconButton aria-label={t('profile.header.close_profile')} onClick={onClose}>
            <CloseIcon />
          </DrawerIconButton>
        </DrawerHeader>
        <UserBlock>
          <ProfileAvatar address={address} size={56} />
          <UserNameColumn>
            <UserName>{displayName}</UserName>
            <UserAddressRow>
              <UserAddressText>{shortenAddress(address)}</UserAddressText>
              <AddressCopyButton aria-label={t('profile.header.copy_address')} size="small" onClick={handleCopyAddress}>
                <ContentCopyIcon />
              </AddressCopyButton>
            </UserAddressRow>
          </UserNameColumn>
        </UserBlock>
        {isOwnProfile ? (
          <CtaRow>
            {typeof friendsCount === 'number' ? (
              <DrawerCta
                variant="outlined"
                color="inherit"
                startIcon={<PeopleAltOutlinedIcon />}
                onClick={() => setIsFriendsModalOpen(true)}
              >
                {t('profile.header.friends_count', { count: friendsCount })}
              </DrawerCta>
            ) : null}
            <DrawerCta variant="outlined" color="inherit" startIcon={<ShareOutlinedIcon />} onClick={handleShareProfile}>
              {t(hasCopiedInvite ? 'profile.header.invite_copied' : 'profile.header.invite_friends')}
            </DrawerCta>
          </CtaRow>
        ) : (
          <>
            {mutualCount > 0 ? (
              <MutualRow>
                <MutualStack>
                  {mutualSlots.map((slot, idx) =>
                    slot.address ? (
                      <MutualSlot key={`avatar-${slot.address}-${idx}`} $offset={idx}>
                        <ProfileAvatar address={slot.address} size={24} borderColor="rgba(255, 255, 255, 0.5)" />
                      </MutualSlot>
                    ) : (
                      <MutualDot key={`dot-${idx}-${slot.color}`} $bg={slot.color} $offset={idx} aria-hidden />
                    )
                  )}
                </MutualStack>
                <span>
                  <strong>{mutualCount}</strong> {t('profile.header.mutual_count', { count: '' }).replace('{count}', '').trim()}
                </span>
              </MutualRow>
            ) : null}
            <CtaRow>
              <DrawerCta
                variant="contained"
                color="primary"
                startIcon={friendButton.icon}
                onClick={handleFriendAction}
                disabled={!canQueryFriendship || isLoadingFriendship || isUpdatingFriendship || friendshipStatus === 'blocked'}
              >
                {t(friendButton.labelKey)}
              </DrawerCta>
            </CtaRow>
          </>
        )}
        <SectionDivider />
        <TabList>
          {tabs.map(tab => {
            // eslint-disable-next-line @typescript-eslint/naming-convention -- React component alias must be PascalCase
            const LeadingIcon = TAB_ICONS.get(tab.id)
            return (
              <TabItem
                key={tab.id}
                type="button"
                $active={tab.id === activeTab}
                onClick={() => {
                  onTabSelect(tab.id)
                  onClose()
                }}
              >
                <TabLeading>{LeadingIcon ? <LeadingIcon fontSize="small" /> : null}</TabLeading>
                <TabLabel>{t(tab.labelKey)}</TabLabel>
                <TabChevron>
                  <ChevronRightIcon fontSize="small" />
                </TabChevron>
              </TabItem>
            )
          })}
        </TabList>
        {isOwnProfile ? (
          <LogoutButton type="button" onClick={handleLogout}>
            <TabLeading>
              <LogoutIcon fontSize="small" />
            </TabLeading>
            <TabLabel>{t('profile.header.logout')}</TabLabel>
          </LogoutButton>
        ) : null}
        {isOwnProfile ? (
          <FriendsModal
            open={isFriendsModalOpen}
            onClose={() => setIsFriendsModalOpen(false)}
            onSelect={friend => {
              setIsFriendsModalOpen(false)
              onClose()
              navigate(`/profile/${friend.address.toLowerCase()}`)
            }}
          />
        ) : null}
      </MobileDrawer>
    )
  }
)

export { ProfileMobileMenu }
export type { ProfileMobileMenuProps }
