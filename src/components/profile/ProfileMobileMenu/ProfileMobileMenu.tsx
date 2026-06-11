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
import { redirectToAuth } from '../../../utils/authRedirect'
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
  MutualDot,
  MutualRow,
  MutualSlot,
  MutualStack,
  NavScreen,
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

interface ProfileMobileNavProps {
  address: string
  displayName: string
  isOwnProfile: boolean
  activeTab?: ProfileTab
  onTabSelect: (tab: ProfileTab) => void
  /** Tabs hidden by `useProfileTabAvailability`. The nav applies the same filter as the desktop nav. */
  hiddenTabs?: Set<ProfileTab>
  /** Back chevron in the top row — browser/back navigation owned by the mount. */
  onBack?: () => void
  /** X in the top row — only modal mounts close the profile, so the row hides it otherwise. */
  onClose?: () => void
}

function shortenAddress(value: string): string {
  if (value.length < 12) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

/**
 * Mobile root screen of the profile (Figma 167:85610 member / 322:49246 own): full-width
 * navigation list — identity block, friendship/share CTAs and one row per visible tab.
 * Replaces the old side-drawer; on mobile each tab then renders as its own sub-screen.
 */
const ProfileMobileNav = memo(
  ({ address, displayName, isOwnProfile, activeTab, onTabSelect, hiddenTabs, onBack, onClose }: ProfileMobileNavProps) => {
    const t = useFormatMessage()
    const { hasValidIdentity } = useAuthIdentity()
    const { disconnect } = useWalletAddress()
    const navigate = useNavigate()
    const canQueryFriendship = !isOwnProfile && hasValidIdentity
    const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false)
    const [isMutualModalOpen, setIsMutualModalOpen] = useState(false)
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
      // Anonymous viewers: route to /sign-in, post-auth return brings them back to this profile.
      if (!isOwnProfile && !hasValidIdentity) {
        const here = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/'
        redirectToAuth(here)
        return
      }
      if (!canQueryFriendship) return
      void upsertFriendship({ address, action: friendButton.action }).catch(() => {
        /* error surfaced via the hook's `error` state */
      })
    }, [address, canQueryFriendship, friendButton.action, hasValidIdentity, isOwnProfile, upsertFriendship])

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
    }, [disconnect])

    return (
      <NavScreen>
        {onBack || onClose ? (
          <DrawerHeader>
            {onBack ? (
              <DrawerIconButton aria-label={t('profile.header.back')} onClick={onBack}>
                <ArrowBackIosNewIcon fontSize="small" />
              </DrawerIconButton>
            ) : (
              <span />
            )}
            {onClose ? (
              <DrawerIconButton aria-label={t('profile.header.close_profile')} onClick={onClose}>
                <CloseIcon />
              </DrawerIconButton>
            ) : null}
          </DrawerHeader>
        ) : null}
        <UserBlock>
          <ProfileAvatar address={address} size={76} />
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
              {/* Mobile root copy per Figma 322:49246 — "Share Profile" (the action still copies the invite link). */}
              {t(hasCopiedInvite ? 'profile.header.invite_copied' : 'profile.header.share_profile')}
            </DrawerCta>
          </CtaRow>
        ) : (
          <>
            {mutualCount > 0 ? (
              <MutualRow
                type="button"
                onClick={() => setIsMutualModalOpen(true)}
                aria-label={t('profile.friends_modal.mutual_title', { count: mutualCount })}
              >
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
                disabled={isOwnProfile || isLoadingFriendship || isUpdatingFriendship || friendshipStatus === 'blocked'}
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
              <TabItem key={tab.id} type="button" $active={tab.id === activeTab} onClick={() => onTabSelect(tab.id)}>
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
              navigate(`/profile/${friend.address.toLowerCase()}`)
            }}
          />
        ) : (
          <FriendsModal
            open={isMutualModalOpen}
            onClose={() => setIsMutualModalOpen(false)}
            mutualOfAddress={address}
            onSelect={friend => {
              setIsMutualModalOpen(false)
              navigate(`/profile/${friend.address.toLowerCase()}`)
            }}
          />
        )}
      </NavScreen>
    )
  }
)

ProfileMobileNav.displayName = 'ProfileMobileNav'

export { ProfileMobileNav }
export type { ProfileMobileNavProps }
