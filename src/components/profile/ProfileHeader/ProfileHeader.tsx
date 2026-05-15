import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import BlockIcon from '@mui/icons-material/Block'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
// eslint-disable-next-line @typescript-eslint/naming-convention
import MenuIcon from '@mui/icons-material/Menu'
// eslint-disable-next-line @typescript-eslint/naming-convention
import MoreVertIcon from '@mui/icons-material/MoreVert'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { Button, Menu, MenuItem, useTabletAndBelowMediaQuery } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import {
  useBlockUser,
  useFriendsCount,
  useFriendshipStatus,
  useMutualFriends,
  useUpsertFriendship
} from '../../../features/profile/profile.social.rpc'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useProfileAvatar } from '../../../hooks/useProfileAvatar'
import { redirectToAuth } from '../../../utils/authRedirect'
import { getAvatarBackgroundColor, getDisplayName } from '../../../utils/avatarColor'
import { FriendsModal } from '../FriendsModal'
import { ProfileAvatar } from '../ProfileAvatar'
import { getFriendButtonConfig } from './ProfileHeader.helpers'
import {
  ActionsBlock,
  AddressRow,
  AddressText,
  BackIconButton,
  BlockMenuItemIcon,
  CloseIconButton,
  CopyButton,
  CopyButtonIcon,
  Discriminator,
  HeaderRoot,
  IdentityBlock,
  MobileMenuIconButton,
  MoreActionsButton,
  MutualAvatarSlot,
  MutualFriendsRow,
  MutualPic,
  MutualStack,
  MutualText,
  NameAddressBlock,
  NameRow,
  NameText,
  VerifiedBadge,
  WalletIcon
} from './ProfileHeader.styled'

interface ProfileHeaderProps {
  address: string
  isOwnProfile: boolean
  /** When provided, renders the close (X) icon button. Only modal mounts pass this — the standalone route omits it. */
  onClose?: () => void
  /** When set, a back chevron renders before the avatar. Used when the profile modal opens on top of another modal. */
  onBack?: () => void
  /** When set, renders the mobile hamburger (visible only `<md`) — clicking it opens the tabs drawer. */
  onOpenMenu?: () => void
}

function truncateAddress(value: string): string {
  if (value.length < 12) return value
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

// `getFriendButtonConfig` lives in `./ProfileHeader.helpers` so `ProfileMobileMenu` can reuse the
// same logic without duplicating the friendship-status switch.

function ProfileHeader({ address, isOwnProfile, onClose, onBack, onOpenMenu }: ProfileHeaderProps) {
  const t = useFormatMessage()
  const isMobile = useTabletAndBelowMediaQuery()
  const { name, avatar, backgroundColor } = useProfileAvatar(address)
  const { hasValidIdentity } = useAuthIdentity()

  const hasClaimedName = avatar?.hasClaimedName ?? false
  const discriminator = !hasClaimedName && avatar?.userId ? `#${avatar.userId.slice(-4)}` : ''
  const displayName = name && name.length > 0 ? name : truncateAddress(address)
  // ADR-292 NameColorHelper: the name text uses the same deterministic hue as
  // the avatar fallback background, so the surface is visually coherent with
  // every other avatar render in the site and the unity-explorer.
  const nameColor = backgroundColor

  const canQueryFriendship = !isOwnProfile && hasValidIdentity
  const { status: friendshipStatus, isLoading: isLoadingFriendship } = useFriendshipStatus(canQueryFriendship ? address : undefined)
  const { upsert: upsertFriendship, isLoading: isUpdatingFriendship } = useUpsertFriendship()
  const friendButton = getFriendButtonConfig(friendshipStatus)
  const { count: friendsCount } = useFriendsCount()
  const { setBlocked, isLoading: isUpdatingBlock } = useBlockUser()
  const [blockMenuAnchor, setBlockMenuAnchor] = useState<HTMLElement | null>(null)
  const { count: mutualCount, friends: mutualFriendsPreview } = useMutualFriends(canQueryFriendship ? address : undefined)
  // Build up to 3 slots when at least one mutual friend exists. If the RPC populated the
  // preview list we render real `ProfileAvatar`s (which resolve the face image and fall back
  // to a deterministic colour + initial). Otherwise we emit a colour-only dot so the cluster
  // still mirrors the count even before the preview lands.
  const mutualSlots = Array.from({ length: Math.min(3, mutualCount) }, (_, idx) => {
    const friend = mutualFriendsPreview[idx]
    if (friend?.address) return { kind: 'avatar' as const, address: friend.address }
    const displayName = friend
      ? getDisplayName({ name: friend.name, hasClaimedName: friend.hasClaimedName, ethAddress: friend.address })
      : ''
    const color = getAvatarBackgroundColor(displayName || `${address}-${idx}`)
    return { kind: 'dot' as const, color }
  })
  const [hasCopiedInvite, setHasCopiedInvite] = useState(false)
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false)
  const navigate = useNavigate()

  const handleCopyAddress = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(address)
    }
  }, [address])

  const handleFriendAction = useCallback(() => {
    // Anonymous viewers see the CTA enabled (per Figma) — clicking redirects to sign-in and
    // sends them back to this profile so the action can complete after auth. The `!isOwnProfile`
    // guard remains because there's no scenario where you "Add Friend" to your own profile.
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

  const handleToggleBlock = useCallback(() => {
    setBlockMenuAnchor(null)
    if (!canQueryFriendship) return
    void setBlocked({ address, blocked: friendshipStatus !== 'blocked' }).catch(() => {
      /* error surfaced via the hook's `error` state */
    })
  }, [address, canQueryFriendship, friendshipStatus, setBlocked])

  const handleGetAName = useCallback(() => {
    const builderUrl = getEnv('BUILDER_URL')
    if (!builderUrl) return
    window.open(`${builderUrl.replace(/\/+$/, '')}/names`, '_blank', 'noopener,noreferrer')
  }, [])

  const handleInviteFriends = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.clipboard || typeof window === 'undefined') return
    const inviteUrl = `${window.location.origin}/invite/${address}`
    void navigator.clipboard.writeText(inviteUrl).then(() => {
      setHasCopiedInvite(true)
      setTimeout(() => setHasCopiedInvite(false), 2000)
    })
  }, [address])

  return (
    <HeaderRoot>
      <IdentityBlock>
        {onBack ? (
          <BackIconButton aria-label={t('profile.header.back')} onClick={onBack}>
            <ArrowBackIosNewIcon />
          </BackIconButton>
        ) : null}
        <ProfileAvatar address={address} size={isMobile ? 48 : 76} borderColor="rgba(255, 255, 255, 0.5)" />
        <NameAddressBlock>
          <NameRow>
            <NameText variant="h5" $nameColor={nameColor}>
              {displayName}
            </NameText>
            {discriminator ? <Discriminator>{discriminator}</Discriminator> : null}
            {hasClaimedName ? (
              <VerifiedBadge $nameColor={nameColor} title="Verified">
                ✓
              </VerifiedBadge>
            ) : null}
          </NameRow>
          <AddressRow>
            <WalletIcon>
              <AccountBalanceWalletOutlinedIcon />
            </WalletIcon>
            <AddressText>{truncateAddress(address)}</AddressText>
            <CopyButton aria-label={t('profile.header.copy_address')} size="small" onClick={handleCopyAddress}>
              <CopyButtonIcon>
                <ContentCopyIcon />
              </CopyButtonIcon>
            </CopyButton>
          </AddressRow>
        </NameAddressBlock>
      </IdentityBlock>
      <ActionsBlock>
        {isOwnProfile ? (
          <>
            {typeof friendsCount === 'number' ? (
              <Button
                variant="outlined"
                color="inherit"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<PeopleAltOutlinedIcon />}
                onClick={() => setIsFriendsModalOpen(true)}
              >
                {t('profile.header.friends_count', { count: friendsCount })}
              </Button>
            ) : null}
            {!hasClaimedName ? (
              <Button
                variant="contained"
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<BadgeOutlinedIcon />}
                onClick={handleGetAName}
              >
                {t('profile.header.get_a_name')}
              </Button>
            ) : null}
            <Button
              variant="outlined"
              color="inherit"
              size={isMobile ? 'small' : 'medium'}
              startIcon={<PersonAddIcon />}
              onClick={handleInviteFriends}
            >
              {t(hasCopiedInvite ? 'profile.header.invite_copied' : 'profile.header.invite_friends')}
            </Button>
          </>
        ) : (
          <>
            {mutualCount > 0 ? (
              <MutualFriendsRow>
                <MutualStack>
                  {mutualSlots.map((slot, idx) =>
                    slot.kind === 'avatar' ? (
                      <MutualAvatarSlot key={`avatar-${slot.address}-${idx}`} $offset={idx}>
                        <ProfileAvatar address={slot.address} size={28} borderColor="rgba(255, 255, 255, 0.5)" />
                      </MutualAvatarSlot>
                    ) : (
                      <MutualPic key={`dot-${idx}-${slot.color}`} $bg={slot.color} $offset={idx} aria-hidden />
                    )
                  )}
                </MutualStack>
                <MutualText>
                  <strong>{mutualCount}</strong> {t('profile.header.mutual_count', { count: '' }).replace('{count}', '').trim()}
                </MutualText>
              </MutualFriendsRow>
            ) : null}
            <Button
              variant="contained"
              color="primary"
              size={isMobile ? 'small' : 'medium'}
              startIcon={friendButton.icon}
              onClick={handleFriendAction}
              disabled={isOwnProfile || isLoadingFriendship || isUpdatingFriendship || friendshipStatus === 'blocked'}
            >
              {t(friendButton.labelKey)}
            </Button>
            <MoreActionsButton
              aria-label={t('profile.header.more_actions')}
              onClick={event => setBlockMenuAnchor(event.currentTarget)}
              disabled={!canQueryFriendship || isUpdatingBlock}
            >
              <MoreVertIcon />
            </MoreActionsButton>
            <Menu anchorEl={blockMenuAnchor} open={Boolean(blockMenuAnchor)} onClose={() => setBlockMenuAnchor(null)}>
              <MenuItem onClick={handleToggleBlock}>
                <BlockMenuItemIcon>
                  <BlockIcon fontSize="small" />
                </BlockMenuItemIcon>
                {t(friendshipStatus === 'blocked' ? 'profile.header.unblock' : 'profile.header.block')}
              </MenuItem>
            </Menu>
          </>
        )}
        {onOpenMenu ? (
          <MobileMenuIconButton aria-label={t('profile.header.open_menu')} onClick={onOpenMenu}>
            <MenuIcon />
          </MobileMenuIconButton>
        ) : null}
        {onClose ? (
          <CloseIconButton aria-label={t('profile.header.close_profile')} onClick={onClose}>
            <CloseIcon />
          </CloseIconButton>
        ) : null}
      </ActionsBlock>
      {isOwnProfile ? (
        <FriendsModal
          open={isFriendsModalOpen}
          onClose={() => setIsFriendsModalOpen(false)}
          onSelect={friend => {
            setIsFriendsModalOpen(false)
            navigate(`/profile/${friend.address.toLowerCase()}`)
          }}
        />
      ) : null}
    </HeaderRoot>
  )
}

export { ProfileHeader }
export type { ProfileHeaderProps }
