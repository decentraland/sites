import type { CommunityEvent } from '../features/social/communities/communities.types'

type UsePaginatedCommunityEventsOptions = {
  communityId: string
  enabled?: boolean
}

type UsePaginatedCommunityEventsResult = {
  events: CommunityEvent[]
  isLoading: boolean
  isFetchingMore: boolean
  hasMore: boolean
  loadMore: () => void
  total: number
}

export type { UsePaginatedCommunityEventsOptions, UsePaginatedCommunityEventsResult }
