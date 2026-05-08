import { useGetCommunityEventsQuery } from '../features/communities/communities.client'
import type { CommunityEvent, CommunityEventsResponse } from '../features/communities/communities.types'
import { usePaginatedQuery } from './usePaginatedQuery'
import type { UsePaginatedCommunityEventsOptions, UsePaginatedCommunityEventsResult } from './usePaginatedCommunityEvents.types'

const DEFAULT_LIMIT = 12

function usePaginatedCommunityEvents({
  communityId,
  enabled = true
}: UsePaginatedCommunityEventsOptions): UsePaginatedCommunityEventsResult {
  const result = usePaginatedQuery<{ communityId: string; limit?: number; offset?: number }, CommunityEventsResponse, CommunityEvent[]>({
    queryHook: useGetCommunityEventsQuery,
    queryArg: { communityId },
    enabled: enabled && !!communityId,
    defaultLimit: DEFAULT_LIMIT,
    extractItems: data => data.data.events ?? [],
    extractTotal: data => data.data.total ?? 0,
    getHasMore: data => {
      const current = data.data.events?.length ?? 0
      const total = data.data.total ?? 0
      return current < total
    },
    resetDependency: communityId
  })

  return {
    events: result.items,
    isLoading: result.isLoading,
    isFetchingMore: result.isFetchingMore,
    hasMore: result.hasMore,
    loadMore: result.loadMore,
    total: result.total
  }
}

export { usePaginatedCommunityEvents }
