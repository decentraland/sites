import { socialClient } from '../../services/socialClient'
import { getAuthSession } from '../../utils/authSession'

type FriendshipStatus = 'none' | 'pending' | 'accepted' | 'blocked'

interface FriendshipStatusResponse {
  data: { status: FriendshipStatus }
}

interface ProfileCommunity {
  id: string
  name: string
  description?: string
  thumbnail?: string
  membersCount?: number
  role?: 'owner' | 'admin' | 'member'
}

interface ProfileCommunitiesResponse {
  data: { results: ProfileCommunity[]; total: number }
}

const profileSocialApi = socialClient.injectEndpoints({
  endpoints: builder => ({
    getFriendshipStatus: builder.query<FriendshipStatusResponse, { address: string; account: string }>({
      serializeQueryArgs: ({ queryArgs }) => ({
        ...queryArgs,
        address: queryArgs.address.toLowerCase(),
        account: queryArgs.account.toLowerCase()
      }),
      query: ({ address, account }) => ({ url: `/v1/friendships/${encodeURIComponent(address.toLowerCase())}/status`, account }),
      providesTags: (_result, _error, { address }) => [{ type: 'Members', id: `friendship-${address.toLowerCase()}` }]
    }),
    upsertFriendship: builder.mutation<
      FriendshipStatusResponse,
      { address: string; account: string; action: 'request' | 'cancel' | 'accept' | 'block' | 'unblock' }
    >({
      query: ({ address, account, action }) => ({
        account,
        url: `/v1/friendships/${encodeURIComponent(address.toLowerCase())}`,
        method: 'POST',
        body: { action }
      }),
      async onQueryStarted({ address, account, action }, { dispatch, queryFulfilled }) {
        const session = getAuthSession()
        const optimisticStatus: FriendshipStatus =
          action === 'cancel' || action === 'unblock'
            ? 'none'
            : action === 'block'
              ? 'blocked'
              : action === 'accept'
                ? 'accepted'
                : 'pending'
        const patch = dispatch(
          profileSocialApi.util.updateQueryData('getFriendshipStatus', { address, account }, draft => {
            if (draft?.data) draft.data.status = optimisticStatus
          })
        )
        try {
          await queryFulfilled
        } catch {
          if (session === getAuthSession()) patch.undo()
        }
      },
      invalidatesTags: (_result, _error, { address }) => [{ type: 'Members', id: `friendship-${address.toLowerCase()}` }]
    }),
    getProfileCommunities: builder.query<
      ProfileCommunitiesResponse,
      { address: string; account?: string; limit?: number; offset?: number }
    >({
      serializeQueryArgs: ({ queryArgs }) => ({
        ...queryArgs,
        address: queryArgs.address.toLowerCase(),
        account: queryArgs.account?.toLowerCase() ?? 'anon'
      }),
      query: ({ address, account, limit = 24, offset = 0 }) => ({
        url: `/v1/members/${encodeURIComponent(address.toLowerCase())}/communities?limit=${limit}&offset=${offset}`,
        account
      }),
      providesTags: (_result, _error, { address }) => [{ type: 'Communities', id: `member-${address.toLowerCase()}` }, 'Communities']
    })
  })
})

const { useGetFriendshipStatusQuery, useUpsertFriendshipMutation, useGetProfileCommunitiesQuery } = profileSocialApi

export { profileSocialApi, useGetFriendshipStatusQuery, useGetProfileCommunitiesQuery, useUpsertFriendshipMutation }
export type { FriendshipStatus, ProfileCommunity }
