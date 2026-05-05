import { useGetCommunityMembersQuery } from '../features/communities/communities.client'
import type { CommunityMember, CommunityMembersResponse } from '../features/communities/communities.types'
import { usePaginatedQuery } from './usePaginatedQuery'

const DEFAULT_LIMIT = 10

type Options = { communityId: string; enabled?: boolean }

type Result = {
  members: CommunityMember[]
  isLoading: boolean
  isFetchingMore: boolean
  hasMore: boolean
  loadMore: () => void
  total: number
}

function usePaginatedCommunityMembers({ communityId, enabled = true }: Options): Result {
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
