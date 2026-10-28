import { useCallback } from 'react'
import type { FriendProfile } from '../../../features/profile/profile.social.rpc'
import { useModalProfileNavigation } from '../ProfileModal/ModalProfileNavigation'
import { FriendsList } from './FriendsList'
import { FriendsSurfaceRoot } from './FriendsModal.styled'

interface FriendsSurfaceProps {
  /** Lists mutual friends with this address instead of the signed user's own friends. */
  mutualOfAddress?: string
  /** Unwinds one history level (modal surface stack). */
  onBack: () => void
  /** Dismisses the whole dialog. */
  onClose: () => void
}

/**
 * Friends / mutual-friends list as a modal-stack SURFACE (rule: never stack a dialog on
 * a dialog). Picking a friend pushes their profile onto the same stack, so back unwinds
 * profile → friends list → previous surface.
 */
function FriendsSurface({ mutualOfAddress, onBack, onClose }: FriendsSurfaceProps) {
  const openProfile = useModalProfileNavigation()

  const handleSelect = useCallback(
    (friend: FriendProfile) => {
      openProfile?.(friend.address.toLowerCase())
    },
    [openProfile]
  )

  return (
    <FriendsSurfaceRoot>
      <FriendsList enabled onSelect={handleSelect} onClose={onClose} onBack={onBack} mutualOfAddress={mutualOfAddress} />
    </FriendsSurfaceRoot>
  )
}

export { FriendsSurface }
export type { FriendsSurfaceProps }
