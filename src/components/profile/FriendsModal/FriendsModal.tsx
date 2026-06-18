import type { FriendProfile } from '../../../features/profile/profile.social.rpc'
import { FriendsList } from './FriendsList'
import { FriendsDialog } from './FriendsModal.styled'

interface FriendsModalProps {
  open: boolean
  onClose: () => void
  /** Called when the user picks a friend — typically navigates to their profile. */
  onSelect: (friend: FriendProfile) => void
  /**
   * When set, the modal lists the mutual friends between the signed user and this address
   * (member-profile header cluster) instead of the signed user's own friends list.
   */
  mutualOfAddress?: string
}

/** Standalone dialog flavour — used on the profile PAGE. Inside modals the same list renders as a stack surface (see FriendsSurface). */
function FriendsModal({ open, onClose, onSelect, mutualOfAddress }: FriendsModalProps) {
  return (
    <FriendsDialog open={open} onClose={onClose} aria-labelledby="friends-modal-title">
      <FriendsList enabled={open} onSelect={onSelect} onClose={onClose} mutualOfAddress={mutualOfAddress} />
    </FriendsDialog>
  )
}

export { FriendsModal }
export type { FriendsModalProps }
