import { socialClient } from '../../services/socialClient'
import { getAuthSession } from '../../utils/authSession'
import { getEventsApiBaseUrl, mapEventsApiResponse } from './events.helpers'
import {
  type CommunityEventsResponse,
  type CommunityMembersResponse,
  type CommunityResponse,
  type CreateCommunityRequestResponse,
  type JoinCommunityResponse,
  type MemberRequestsResponse,
  RequestIntention,
  RequestStatus,
  RequestType,
  Role
} from './communities.types'
import type { EventsApiResponse } from './events.helpers.types'

const communitiesApi = socialClient.injectEndpoints({
  endpoints: builder => ({
    getCommunityById: builder.query<CommunityResponse, { id: string; account?: string }>({
      query: ({ id, account }) => ({ url: `/v2/communities/${encodeURIComponent(id)}`, account }),
      // Public and each signed-in account have independent role/permission data.
      serializeQueryArgs: ({ queryArgs }) => ({ id: queryArgs.id, account: queryArgs.account?.toLowerCase() ?? 'anon' }),
      providesTags: (result, _error, { id }) => (result ? [{ type: 'Communities' as const, id }, 'Communities'] : ['Communities'])
    }),

    getCommunityMembers: builder.query<CommunityMembersResponse, { id: string; account?: string; limit?: number; offset?: number }>({
      query: ({ id, account, limit, offset }) => {
        const params = new URLSearchParams()
        if (limit !== undefined) params.append('limit', String(limit))
        if (offset !== undefined) params.append('offset', String(offset))
        const qs = params.toString()
        return { url: `/v2/communities/${encodeURIComponent(id)}/members${qs ? `?${qs}` : ''}`, account }
      },
      serializeQueryArgs: ({ queryArgs }) => ({ id: queryArgs.id, account: queryArgs.account?.toLowerCase() ?? 'anon' }),
      merge: (currentCache, newItems) => {
        if (newItems.data.results.length === 0) return currentCache
        return {
          ...newItems,
          data: {
            ...newItems.data,
            results: [...(currentCache?.data?.results ?? []), ...newItems.data.results]
          }
        }
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.offset !== previousArg?.offset || currentArg?.limit !== previousArg?.limit
      },
      providesTags: (result, _error, { id }) => (result ? [{ type: 'Members' as const, id: `${id}-members` }, 'Members'] : ['Members'])
    }),

    // TODO(post-prod): unify this endpoint with `src/features/events/events.client.ts`.
    // Both clients hit the same EVENTS_API_URL, but each lives in its own RTK Query base
    // (`socialClient` here, `eventsClient` there) so they can't share cache entries or tag
    // invalidations — joining a community here does not invalidate the matching event card
    // on /events. After the social rollout stabilizes, fold these into a single events
    // client (or one per backend) and inject community-scoped endpoints from this feature.
    getCommunityEvents: builder.query<CommunityEventsResponse, { communityId: string; account?: string; limit?: number; offset?: number }>({
      query: ({ communityId, account, limit, offset }) => {
        const params = new URLSearchParams()
        params.append('community_id', communityId)
        if (limit !== undefined) params.append('limit', String(limit))
        if (offset !== undefined) params.append('offset', String(offset))
        return {
          url: `/events?${params.toString()}`,
          baseUrl: getEventsApiBaseUrl(),
          account
        }
      },
      transformResponse: (response: EventsApiResponse): CommunityEventsResponse => mapEventsApiResponse(response),
      serializeQueryArgs: ({ queryArgs }) => ({ communityId: queryArgs.communityId, account: queryArgs.account?.toLowerCase() ?? 'anon' }),
      merge: (currentCache, newItems) => {
        if (newItems.data.events.length === 0) return currentCache
        return {
          ...newItems,
          data: {
            ...newItems.data,
            events: [...(currentCache?.data?.events ?? []), ...newItems.data.events],
            total: newItems.data.total
          }
        }
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.offset !== previousArg?.offset || currentArg?.limit !== previousArg?.limit
      },
      providesTags: (result, _error, { communityId }) =>
        result
          ? [
              ...result.data.events.map(event => ({ type: 'Events' as const, id: event.id })),
              { type: 'Events' as const, id: `community-${communityId}` },
              'Events'
            ]
          : ['Events']
    }),

    joinCommunity: builder.mutation<JoinCommunityResponse, { id: string; account: string }>({
      query: ({ id, account }) => ({ url: `/v1/communities/${encodeURIComponent(id)}/members`, method: 'POST', account }),
      async onQueryStarted({ id: communityId, account }, { dispatch, queryFulfilled }) {
        const session = getAuthSession()
        const patch = dispatch(
          communitiesApi.util.updateQueryData('getCommunityById', { id: communityId, account }, draft => {
            if (draft?.data) draft.data.role = Role.MEMBER
          })
        )
        try {
          await queryFulfilled
        } catch {
          if (session === getAuthSession()) patch.undo()
        }
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Communities' as const, id }, 'Communities']
    }),

    createCommunityRequest: builder.mutation<CreateCommunityRequestResponse, { communityId: string; targetedAddress: string }>({
      query: ({ communityId, targetedAddress }) => ({
        account: targetedAddress,
        url: `/v1/communities/${encodeURIComponent(communityId)}/requests`,
        method: 'POST',
        body: {
          targetedAddress,
          type: RequestType.REQUEST_TO_JOIN
        }
      }),
      async onQueryStarted({ communityId, targetedAddress }, api) {
        const session = getAuthSession()
        const { dispatch, queryFulfilled } = api
        const account = targetedAddress
        // Read the signed cache entry for the community via the public selector — never
        // touch socialClient internals (`as any`) because the shape is undocumented.
        const queryState = communitiesApi.endpoints.getCommunityById.select({ id: communityId, account })(api.getState())
        const community = queryState?.data?.data

        const patch = dispatch(
          communitiesApi.util.updateQueryData(
            'getMemberRequests',
            { address: targetedAddress, type: RequestType.REQUEST_TO_JOIN },
            draft => {
              if (!draft?.data) return
              const optimistic = {
                ...(community ?? {}),
                id: `temp-${Date.now()}`,
                communityId,
                type: RequestType.REQUEST_TO_JOIN,
                status: RequestStatus.PENDING
              } as (typeof draft.data.results)[number]
              draft.data.results = [optimistic, ...draft.data.results]
              draft.data.total = (draft.data.total ?? 0) + 1
            }
          )
        )
        try {
          await queryFulfilled
        } catch {
          if (session === getAuthSession()) patch.undo()
        }
      },
      invalidatesTags: (_result, _error, { communityId }) => [
        { type: 'Communities' as const, id: communityId },
        'Communities',
        'MemberRequests'
      ]
    }),

    cancelCommunityRequest: builder.mutation<void, { communityId: string; requestId: string; address: string }>({
      query: ({ communityId, requestId, address }) => ({
        account: address,
        url: `/v1/communities/${encodeURIComponent(communityId)}/requests/${encodeURIComponent(requestId)}`,
        method: 'PATCH',
        body: { intention: RequestIntention.CANCELLED }
      }),
      async onQueryStarted({ requestId, address }, { dispatch, queryFulfilled }) {
        const session = getAuthSession()
        let patch: { undo: () => void } | null = null
        if (address) {
          patch = dispatch(
            communitiesApi.util.updateQueryData('getMemberRequests', { address, type: RequestType.REQUEST_TO_JOIN }, draft => {
              if (!draft?.data) return
              draft.data.results = draft.data.results.filter(req => req.id !== requestId)
              draft.data.total = Math.max((draft.data.total ?? 0) - 1, 0)
            })
          )
        }
        try {
          await queryFulfilled
        } catch {
          if (session === getAuthSession()) patch?.undo()
        }
      },
      invalidatesTags: (_result, _error, { communityId }) => [
        { type: 'Communities' as const, id: communityId },
        'Communities',
        'MemberRequests'
      ]
    }),

    getMemberRequests: builder.query<MemberRequestsResponse, { address: string; type?: RequestType }>({
      serializeQueryArgs: ({ queryArgs }) => ({ ...queryArgs, address: queryArgs.address.toLowerCase() }),
      query: ({ address, type }) => {
        const params = new URLSearchParams()
        if (type) params.append('type', type)
        const qs = params.toString()
        return { url: `/v2/members/${encodeURIComponent(address)}/requests${qs ? `?${qs}` : ''}`, account: address }
      },
      providesTags: (result, _error, { address }) =>
        result ? [{ type: 'MemberRequests' as const, id: address }, 'MemberRequests'] : ['MemberRequests']
    })
  })
})

const {
  useGetCommunityByIdQuery,
  useGetCommunityMembersQuery,
  useGetCommunityEventsQuery,
  useJoinCommunityMutation,
  useCreateCommunityRequestMutation,
  useCancelCommunityRequestMutation,
  useGetMemberRequestsQuery
} = communitiesApi

export {
  communitiesApi,
  useCancelCommunityRequestMutation,
  useCreateCommunityRequestMutation,
  useGetCommunityByIdQuery,
  useGetCommunityEventsQuery,
  useGetCommunityMembersQuery,
  useGetMemberRequestsQuery,
  useJoinCommunityMutation
}
