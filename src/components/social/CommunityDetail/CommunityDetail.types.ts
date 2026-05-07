import type { Community } from '../../../features/social/communities/communities.types'

enum AllowedAction {
  JOIN = 'join',
  REQUEST_TO_JOIN = 'requestToJoin'
}

type CommunityDetailProps = {
  community: Community
  isLoggedIn: boolean
  address?: string
}

export { AllowedAction }
export type { CommunityDetailProps }
