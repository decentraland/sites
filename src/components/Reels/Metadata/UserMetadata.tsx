import { type MouseEvent, memo, useCallback, useMemo, useState } from 'react'
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { useAnalytics } from '@dcl/hooks'
import { buildProfileUrl } from '../../../features/reels'
import type { ImageUser } from '../../../features/reels'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import wearableShirtSrc from '../../../images/reels/wearable-shirt.svg'
import { SegmentEvent } from '../../../modules/segment'
import { useOpenProfileModal } from '../../profile/ProfileModal/useOpenProfileModal'
import { WearableMetadata } from './WearableMetadata'
import {
  ChevronButton,
  GuestBadge,
  NoWearablesBox,
  NoWearablesText,
  UserAvatar,
  UserAvatarFallback,
  UserMetadataContainer,
  UserMetadataRow,
  UserMetadataWrapper,
  UserName,
  UserNameStatic,
  WearablesPanel,
  WearablesTitle
} from './UserMetadata.styled'

interface UserMetadataProps {
  user: ImageUser
  isFirst: boolean
  initialWearableVisibility?: boolean
}

const UserMetadata = memo(({ user, isFirst, initialWearableVisibility = false }: UserMetadataProps) => {
  const l = useFormatMessage()
  const { track } = useAnalytics()
  const openProfile = useOpenProfileModal()
  const [showWearables, setShowWearables] = useState(initialWearableVisibility)

  // Internal profile route used as the visible href (right-click → Open in new
  // tab still works). The onClick intercepts left-click and either swaps the
  // surrounding modal (when a ModalProfileNavigationProvider is mounted) or
  // sets `?profile=<addr>` so ProfileModalHost opens the modal overlay.
  const profileUrl = useMemo(() => (user.userAddress ? `/profile/${user.userAddress.toLowerCase()}` : undefined), [user.userAddress])
  // Kept around for the segment payload — reels analytics still references the
  // legacy URL shape, so we keep tracking the same field.
  const legacyProfileUrl = useMemo(() => (user.userAddress ? buildProfileUrl(user.userAddress) : undefined), [user.userAddress])

  const handleProfileClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      track(SegmentEvent.REELS_CLICK_PROFILE, { userAddress: user.userAddress, legacyProfileUrl })
      if (!user.userAddress) return
      // Left-click + no modifier → SPA navigation via the profile modal flow.
      // Allow ctrl/meta/middle-click to fall through so users can still open
      // the profile in a new tab via the rendered href.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
      event.preventDefault()
      openProfile(user.userAddress)
    },
    [track, user.userAddress, legacyProfileUrl, openProfile]
  )

  const handleToggle = useCallback(() => {
    setShowWearables(previous => {
      const next = !previous
      track(next ? SegmentEvent.REELS_SHOW_WEARABLES : SegmentEvent.REELS_HIDE_WEARABLES, {
        userAddress: user.userAddress
      })
      return next
    })
  }, [track, user.userAddress])

  const wearables = user.wearablesParsed ?? []

  return (
    <UserMetadataContainer isFirst={isFirst}>
      <UserMetadataRow>
        <UserMetadataWrapper>
          {user.faceUrl ? <UserAvatar src={user.faceUrl} alt="" loading="lazy" /> : <UserAvatarFallback aria-hidden="true" />}
          {profileUrl ? (
            <UserName href={profileUrl} onClick={handleProfileClick}>
              {user.userName}
            </UserName>
          ) : (
            <UserNameStatic>{user.userName}</UserNameStatic>
          )}
          {user.isGuest && <GuestBadge label={l('component.reels.metadata.guest')} />}
        </UserMetadataWrapper>
        <ChevronButton role="button" aria-label="toggle-wearables" tabIndex={0} onClick={handleToggle}>
          {showWearables ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </ChevronButton>
      </UserMetadataRow>
      <WearablesPanel visible={showWearables}>
        <WearablesTitle>{l('component.reels.metadata.wearable')}</WearablesTitle>
        {wearables.length === 0 ? (
          <NoWearablesBox>
            <img src={wearableShirtSrc} alt="" />
            <NoWearablesText>{l('component.reels.metadata.no_wearable')}</NoWearablesText>
          </NoWearablesBox>
        ) : (
          wearables.map(wearable => <WearableMetadata key={wearable.id} wearable={wearable} />)
        )}
      </WearablesPanel>
    </UserMetadataContainer>
  )
})

export { UserMetadata }
