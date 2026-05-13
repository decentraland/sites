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
import CheckIcon from '@mui/icons-material/Check'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
// eslint-disable-next-line @typescript-eslint/naming-convention
import MoreVertIcon from '@mui/icons-material/MoreVert'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonAddIcon from '@mui/icons-material/PersonAdd'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import { Button, IconButton, Menu, MenuItem } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import {
  useBlockUser,
  useFriendsCount,
  useFriendshipStatus,
  useMutualFriends,
  useUpsertFriendship
} from '../../../features/profile/profile.social.rpc'
import type { FriendshipAction, FriendshipStatus } from '../../../features/profile/profile.social.rpc'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useProfileAvatar } from '../../../hooks/useProfileAvatar'
import { getAvatarBackgroundColor, getDisplayName } from '../../../utils/avatarColor'
import { FriendsModal } from '../FriendsModal'
import { ProfileAvatar } from '../ProfileAvatar'
import {
  ActionsBlock,
  AddressRow,
  AddressText,
  BackIconButton,
  CloseIconButton,
  CopyButton,
  Discriminator,
  HeaderRoot,
  IdentityBlock,
  MutualFriendsRow,
  MutualPic,
  MutualStack,
  MutualText,
  NameAddressBlock,
  NameRow,
  NameText,
  VerifiedBadge
} from './ProfileHeader.styled'

interface ProfileHeaderProps {
  address: string
  isOwnProfile: boolean
  /** When provided, renders the close (X) icon button. Only modal mounts pass this — the standalone route omits it. */
  onClose?: () => void
  /** When set, a back chevron renders before the avatar. Used when the profile modal opens on top of another modal. */
  onBack?: () => void
}

function truncateAddress(value: string): string {
  if (value.length < 12) return value
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

interface FriendButtonConfig {
  labelKey: string
  icon: React.ReactNode
  action: FriendshipAction
}

function getFriendButtonConfig(status: FriendshipStatus | undefined): FriendButtonConfig {
  switch (status) {
    case 'request_sent':
      return { labelKey: 'profile.header.request_sent', icon: <CheckIcon />, action: 'cancel' }
    case 'request_received':
      return { labelKey: 'profile.header.add_friend', icon: <PersonAddIcon />, action: 'accept' }
    case 'accepted':
      return { labelKey: 'profile.header.remove_friend', icon: <PersonRemoveIcon />, action: 'remove' }
    case 'blocked':
    case 'none':
    default:
      return { labelKey: 'profile.header.add_friend', icon: <PersonAddIcon />, action: 'request' }
  }
}

function ProfileHeader({ address, isOwnProfile, onClose, onBack }: ProfileHeaderProps) {
  const t = useFormatMessage()
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
  const mutualAvatarColors = mutualFriendsPreview.slice(0, 3).map(friend => {
    const displayName = getDisplayName({ name: friend.name, hasClaimedName: friend.hasClaimedName, ethAddress: friend.address })
    return getAvatarBackgroundColor(displayName || friend.address)
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
    if (!canQueryFriendship) return
    void upsertFriendship({ address, action: friendButton.action }).catch(() => {
      /* error surfaced via the hook's `error` state */
    })
  }, [address, canQueryFriendship, friendButton.action, upsertFriendship])

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
        <ProfileAvatar address={address} size={76} borderColor="rgba(255, 255, 255, 0.5)" />
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
            <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 18 }} />
            <AddressText>{truncateAddress(address)}</AddressText>
            <CopyButton aria-label={t('profile.header.copy_address')} size="small" onClick={handleCopyAddress}>
              <ContentCopyIcon sx={{ fontSize: 14 }} />
            </CopyButton>
          </AddressRow>
        </NameAddressBlock>
      </IdentityBlock>
      <ActionsBlock>
        {isOwnProfile ? (
          <>
            {typeof friendsCount === 'number' ? (
              <Button variant="outlined" color="inherit" startIcon={<PeopleAltOutlinedIcon />} onClick={() => setIsFriendsModalOpen(true)}>
                {t('profile.header.friends_count', { count: friendsCount })}
              </Button>
            ) : null}
            {!hasClaimedName ? (
              <Button variant="contained" color="primary" startIcon={<BadgeOutlinedIcon />} onClick={handleGetAName}>
                {t('profile.header.get_a_name')}
              </Button>
            ) : null}
            <Button variant="outlined" color="inherit" startIcon={<PersonAddIcon />} onClick={handleInviteFriends}>
              {t(hasCopiedInvite ? 'profile.header.invite_copied' : 'profile.header.invite_friends')}
            </Button>
          </>
        ) : (
          <>
            {mutualCount > 0 ? (
              <MutualFriendsRow>
                <MutualStack>
                  {mutualAvatarColors.map((color, idx) => (
                    <MutualPic key={`${color}-${idx}`} $bg={color} $offset={idx} aria-hidden />
                  ))}
                </MutualStack>
                <MutualText>
                  <strong>{mutualCount}</strong> {t('profile.header.mutual_count', { count: '' }).replace('{count}', '').trim()}
                </MutualText>
              </MutualFriendsRow>
            ) : null}
            <Button
              variant="contained"
              color="primary"
              startIcon={friendButton.icon}
              onClick={handleFriendAction}
              disabled={!canQueryFriendship || isLoadingFriendship || isUpdatingFriendship || friendshipStatus === 'blocked'}
            >
              {t(friendButton.labelKey)}
            </Button>
            <IconButton
              aria-label={t('profile.header.more_actions')}
              onClick={event => setBlockMenuAnchor(event.currentTarget)}
              disabled={!canQueryFriendship || isUpdatingBlock}
              sx={{ color: 'common.white' }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={blockMenuAnchor} open={Boolean(blockMenuAnchor)} onClose={() => setBlockMenuAnchor(null)}>
              <MenuItem onClick={handleToggleBlock}>
                <BlockIcon fontSize="small" sx={{ mr: 1 }} />
                {t(friendshipStatus === 'blocked' ? 'profile.header.unblock' : 'profile.header.block')}
              </MenuItem>
            </Menu>
          </>
        )}
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
