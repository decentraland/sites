import { useCallback } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
// eslint-disable-next-line @typescript-eslint/naming-convention
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CloseIcon from '@mui/icons-material/Close'
// eslint-disable-next-line @typescript-eslint/naming-convention
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { Button } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useProfileAvatar } from '../../../hooks/useProfileAvatar'
import { ProfileAvatar } from '../ProfileAvatar'
import {
  ActionsBlock,
  AddressRow,
  AddressText,
  BackIconButton,
  CloseIconButton,
  CopyButton,
  Discriminator,
  Divider,
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
  /** Friends count visible only on My Profile. */
  friendsCount?: number
  /** Mutual friends (up to 3 avatars + total) visible only on Member Profile when viewer authed. */
  mutualFriends?: { count: number; avatarColors: readonly string[] }
}

function truncateAddress(value: string): string {
  if (value.length < 12) return value
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

function ProfileHeader({ address, isOwnProfile, onClose, onBack, friendsCount, mutualFriends }: ProfileHeaderProps) {
  const t = useFormatMessage()
  const { name, avatar, backgroundColor } = useProfileAvatar(address)

  const hasClaimedName = avatar?.hasClaimedName ?? false
  const discriminator = !hasClaimedName && avatar?.userId ? `#${avatar.userId.slice(-4)}` : ''
  const displayName = name && name.length > 0 ? name : truncateAddress(address)
  // ADR-292 NameColorHelper: the name text uses the same deterministic hue as
  // the avatar fallback background, so the surface is visually coherent with
  // every other avatar render in the site and the unity-explorer.
  const nameColor = backgroundColor

  const handleCopyAddress = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(address)
    }
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
            {!hasClaimedName ? (
              <Button variant="contained" color="primary" startIcon={<BadgeOutlinedIcon />} disabled>
                {t('profile.header.get_a_name')}
              </Button>
            ) : null}
            {typeof friendsCount === 'number' ? (
              <Button variant="outlined" color="inherit" startIcon={<PeopleAltOutlinedIcon />} disabled>
                {t('profile.header.friends_count', { count: friendsCount })}
              </Button>
            ) : null}
            <Button variant="outlined" color="inherit" startIcon={<PersonAddIcon />} disabled>
              {t('profile.header.invite_friends')}
            </Button>
          </>
        ) : (
          <>
            {mutualFriends && mutualFriends.count > 0 ? (
              <MutualFriendsRow>
                <MutualStack>
                  {mutualFriends.avatarColors.slice(0, 3).map((color, idx) => (
                    <MutualPic key={`${color}-${idx}`} $bg={color} $offset={idx} aria-hidden />
                  ))}
                </MutualStack>
                <MutualText>
                  <strong>{mutualFriends.count}</strong> {t('profile.header.mutual_count', { count: '' }).replace('{count}', '').trim()}
                </MutualText>
              </MutualFriendsRow>
            ) : null}
            {/* Friendship status comes from social-service via @dcl/social-rpc-client (WebSocket RPC),
                not HTTP. Until that client is wired in, the button is a non-functional placeholder. */}
            <Button variant="contained" color="primary" startIcon={<PersonAddIcon />} disabled>
              {t('profile.header.add_friend')}
            </Button>
          </>
        )}
        {onClose ? (
          <>
            <CloseIconButton aria-label={t('profile.header.close_profile')} onClick={onClose}>
              <CloseIcon />
            </CloseIconButton>
            <Divider aria-hidden />
          </>
        ) : null}
      </ActionsBlock>
    </HeaderRoot>
  )
}

export { ProfileHeader }
export type { ProfileHeaderProps }
