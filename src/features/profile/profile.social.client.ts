import { socialClient } from '../../services/socialClient'

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
    getFriendshipStatus: builder.query<FriendshipStatusResponse, { address: string }>({
      query: ({ address }) => `/v1/friendships/${encodeURIComponent(address.toLowerCase())}/status`,
      providesTags: (_result, _error, { address }) => [{ type: 'Members', id: `friendship-${address.toLowerCase()}` }]
    }),
    upsertFriendship: builder.mutation<
      FriendshipStatusResponse,
      { address: string; action: 'request' | 'cancel' | 'accept' | 'block' | 'unblock' }
    >({
      query: ({ address, action }) => ({
        url: `/v1/friendships/${encodeURIComponent(address.toLowerCase())}`,
        method: 'POST',
        body: { action }
      }),
      async onQueryStarted({ address, action }, { dispatch, queryFulfilled }) {
        const optimisticStatus: FriendshipStatus =
          action === 'cancel' || action === 'unblock'
            ? 'none'
            : action === 'block'
              ? 'blocked'
              : action === 'accept'
                ? 'accepted'
                : 'pending'
        const patch = dispatch(
          profileSocialApi.util.updateQueryData('getFriendshipStatus', { address }, draft => {
            if (draft?.data) draft.data.status = optimisticStatus
          })
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: (_result, _error, { address }) => [{ type: 'Members', id: `friendship-${address.toLowerCase()}` }]
    }),
    getProfileCommunities: builder.query<ProfileCommunitiesResponse, { address: string; limit?: number; offset?: number }>({
      query: ({ address, limit = 24, offset = 0 }) =>
        `/v1/members/${encodeURIComponent(address.toLowerCase())}/communities?limit=${limit}&offset=${offset}`,
      providesTags: (_result, _error, { address }) => [{ type: 'Communities', id: `member-${address.toLowerCase()}` }, 'Communities']
    })
  })
})

const { useGetFriendshipStatusQuery, useUpsertFriendshipMutation, useGetProfileCommunitiesQuery } = profileSocialApi

export { profileSocialApi, useGetFriendshipStatusQuery, useGetProfileCommunitiesQuery, useUpsertFriendshipMutation }
export type { FriendshipStatus, ProfileCommunity }
