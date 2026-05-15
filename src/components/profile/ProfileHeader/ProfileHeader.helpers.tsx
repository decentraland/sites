// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckIcon from '@mui/icons-material/Check'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonAddIcon from '@mui/icons-material/PersonAdd'
// eslint-disable-next-line @typescript-eslint/naming-convention
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import type { FriendshipAction, FriendshipStatus } from '../../../features/profile/profile.social.rpc'

interface FriendButtonConfig {
  labelKey: 'profile.header.add_friend' | 'profile.header.request_sent' | 'profile.header.remove_friend'
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

export { getFriendButtonConfig }
export type { FriendButtonConfig }
