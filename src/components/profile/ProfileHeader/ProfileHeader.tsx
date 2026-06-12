import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import BlockIcon from '@mui/icons-material/Block'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
// eslint-disable-next-line @typescript-eslint/naming-convention
import MoreVertIcon from '@mui/icons-material/MoreVert'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PublicIcon from '@mui/icons-material/Public'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import VerifiedIcon from '@mui/icons-material/Verified'
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
import { truncateAddress } from '../../../utils/address'
import { redirectToAuth } from '../../../utils/authRedirect'
import { getAvatarBackgroundColor, getDisplayName } from '../../../utils/avatarColor'
import { FriendsModal } from '../FriendsModal'
import { ProfileAvatar } from '../ProfileAvatar'
import { useModalFriendsNavigation } from '../ProfileModal/ModalProfileNavigation'
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
  FriendCtaButton,
  HeaderRoot,
  IdentityBlock,
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
  /** When true, the header is rendered inside a parent modal: friends / mutual lists open as
   * modal-stack surfaces (via ModalProfileNavigation) instead of a stacked FriendsModal dialog. */
  embedded?: boolean
}

// `getFriendButtonConfig` lives in `./ProfileHeader.helpers` so `ProfileMobileMenu` can reuse the
// same logic without duplicating the friendship-status switch.

function ProfileHeader({ address, isOwnProfile, onClose, onBack, embedded = false }: ProfileHeaderProps) {
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
  const mutualSlots = useMemo(
    () =>
      Array.from({ length: Math.min(3, mutualCount) }, (_, idx) => {
        const friend = mutualFriendsPreview[idx]
        if (friend?.address) return { kind: 'avatar' as const, address: friend.address }
        const displayName = friend
          ? getDisplayName({ name: friend.name, hasClaimedName: friend.hasClaimedName, ethAddress: friend.address })
          : ''
        const color = getAvatarBackgroundColor(displayName || `${address}-${idx}`)
        return { kind: 'dot' as const, color }
      }),
    [address, mutualCount, mutualFriendsPreview]
  )
  const [hasCopiedInvite, setHasCopiedInvite] = useState(false)
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false)
  const [isMutualModalOpen, setIsMutualModalOpen] = useState(false)
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

  // Inside a modal the friends/mutual lists render as stack surfaces (never a dialog on
  // a dialog); on the standalone page they open the FriendsModal dialog.
  const openFriendsSurface = useModalFriendsNavigation()

  const handleGetAName = useCallback(() => {
    const builderUrl = getEnv('BUILDER_URL')
    if (!builderUrl) return
    window.open(`${builderUrl.replace(/\/+$/, '')}/names`, '_blank', 'noopener,noreferrer')
  }, [])

  const handleManageWorld = useCallback(() => {
    const builderUrl = getEnv('BUILDER_URL')
    if (!builderUrl) return
    window.open(`${builderUrl.replace(/\/+$/, '')}/worlds`, '_blank', 'noopener,noreferrer')
  }, [])

  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    },
    []
  )

  const handleInviteFriends = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.clipboard || typeof window === 'undefined') return
    const inviteUrl = `${window.location.origin}/invite/${address}`
    void navigator.clipboard.writeText(inviteUrl).then(() => {
      setHasCopiedInvite(true)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setHasCopiedInvite(false), 2000)
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
            {!hasClaimedName ? (
              <Button
                variant="contained"
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<VerifiedIcon />}
                onClick={handleGetAName}
              >
                {t('profile.header.get_a_name')}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<PublicIcon />}
                onClick={handleManageWorld}
              >
                {t('profile.header.manage_world')}
              </Button>
            )}
            {typeof friendsCount === 'number' && (!embedded || openFriendsSurface) ? (
              <Button
                variant="outlined"
                color="inherit"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<PeopleAltOutlinedIcon />}
                onClick={() => (openFriendsSurface ? openFriendsSurface() : setIsFriendsModalOpen(true))}
              >
                {t('profile.header.friends_count', { count: friendsCount })}
              </Button>
            ) : null}
            <Button
              variant="outlined"
              color="inherit"
              size={isMobile ? 'small' : 'medium'}
              startIcon={<ShareOutlinedIcon />}
              onClick={handleInviteFriends}
            >
              {t(hasCopiedInvite ? 'profile.header.invite_copied' : 'profile.header.invite_friends')}
            </Button>
          </>
        ) : (
          <>
            {mutualCount > 0 ? (
              // Inside a modal the list opens as a stack surface (never a dialog on a dialog);
              // the row only stays disabled when no surface navigation is available.
              <MutualFriendsRow
                type="button"
                onClick={() => (openFriendsSurface ? openFriendsSurface(address) : setIsMutualModalOpen(true))}
                disabled={embedded && !openFriendsSurface}
                aria-label={t('profile.friends_modal.mutual_title', { count: mutualCount })}
              >
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
            <FriendCtaButton
              variant="contained"
              color="primary"
              size={isMobile ? 'small' : 'medium'}
              startIcon={friendButton.icon}
              onClick={handleFriendAction}
              disabled={isOwnProfile || isLoadingFriendship || isUpdatingFriendship || friendshipStatus === 'blocked'}
            >
              {t(friendButton.labelKey)}
            </FriendCtaButton>
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
        {onClose ? (
          <CloseIconButton aria-label={t('profile.header.close_profile')} onClick={onClose}>
            <CloseIcon />
          </CloseIconButton>
        ) : null}
      </ActionsBlock>
      {isOwnProfile && !embedded ? (
        <FriendsModal
          open={isFriendsModalOpen}
          onClose={() => setIsFriendsModalOpen(false)}
          onSelect={friend => {
            setIsFriendsModalOpen(false)
            navigate(`/profile/${friend.address.toLowerCase()}`)
          }}
        />
      ) : null}
      {!isOwnProfile && !embedded ? (
        <FriendsModal
          open={isMutualModalOpen}
          onClose={() => setIsMutualModalOpen(false)}
          mutualOfAddress={address}
          onSelect={friend => {
            setIsMutualModalOpen(false)
            navigate(`/profile/${friend.address.toLowerCase()}`)
          }}
        />
      ) : null}
    </HeaderRoot>
  )
}

export { ProfileHeader }
export type { ProfileHeaderProps }
