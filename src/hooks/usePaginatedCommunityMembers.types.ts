import type { CommunityMember } from '../features/social/communities/communities.types'

type UsePaginatedCommunityMembersOptions = {
  communityId: string
  enabled?: boolean
}

type UsePaginatedCommunityMembersResult = {
  members: CommunityMember[]
  isLoading: boolean
  isFetchingMore: boolean
  hasMore: boolean
  loadMore: () => void
  total: number
}

export type { UsePaginatedCommunityMembersOptions, UsePaginatedCommunityMembersResult }
