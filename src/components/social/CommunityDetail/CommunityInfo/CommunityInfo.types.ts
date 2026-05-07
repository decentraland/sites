import type { Community } from '../../../../features/social/communities/communities.types'

type CommunityInfoProps = {
  community: Community
  isLoggedIn: boolean
  address?: string
  isPerformingCommunityAction: boolean
  isMember: boolean
  canViewContent: boolean
  hasPendingRequest?: boolean
  isLoadingMemberRequests?: boolean
  onJoin: (communityId: string) => Promise<void>
  onRequestToJoin?: (communityId: string) => Promise<void>
  onCancelRequest?: (communityId: string) => Promise<void>
}

export type { CommunityInfoProps }
