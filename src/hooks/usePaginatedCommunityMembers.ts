import { useGetCommunityMembersQuery } from '../features/communities/communities.client'
import type { CommunityMember, CommunityMembersResponse } from '../features/communities/communities.types'
import { usePaginatedQuery } from './usePaginatedQuery'
import type { UsePaginatedCommunityMembersOptions, UsePaginatedCommunityMembersResult } from './usePaginatedCommunityMembers.types'

const DEFAULT_LIMIT = 10

function usePaginatedCommunityMembers({
  communityId,
  enabled = true
}: UsePaginatedCommunityMembersOptions): UsePaginatedCommunityMembersResult {
  const result = usePaginatedQuery<{ id: string; limit?: number; offset?: number }, CommunityMembersResponse, CommunityMember[]>({
    queryHook: useGetCommunityMembersQuery,
    queryArg: { id: communityId },
    enabled: enabled && !!communityId,
    defaultLimit: DEFAULT_LIMIT,
    extractItems: data => data.data.results ?? [],
    extractTotal: data => data.data.total ?? 0,
    getHasMore: data => {
      const currentPage = data.data.page ?? 1
      const totalPages = data.data.pages ?? 1
      return currentPage < totalPages
    },
    resetDependency: communityId
  })

  return {
    members: result.items,
    isLoading: result.isLoading,
    isFetchingMore: result.isFetchingMore,
    hasMore: result.hasMore,
    loadMore: result.loadMore,
    total: result.total
  }
}

export { usePaginatedCommunityMembers }
