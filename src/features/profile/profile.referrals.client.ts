import { referralClient } from '../../services/referralClient'

type ReferralTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND'

interface ReferralReward {
  id: string
  tier: ReferralTier
  description: string
  imageUrl?: string
  claimed: boolean
  unlockedAt?: number
}

interface ReferralStateResponse {
  data: {
    address: string
    inviteCode: string
    inviteUrl: string
    invitedCount: number
    confirmedCount: number
    nextTier?: ReferralTier
    rewards: ReferralReward[]
  }
}

const profileReferralsApi = referralClient.injectEndpoints({
  endpoints: builder => ({
    getReferralState: builder.query<ReferralStateResponse, { address: string }>({
      query: ({ address }) => `/referrals/${encodeURIComponent(address.toLowerCase())}/state`,
      providesTags: (_result, _error, { address }) => [{ type: 'ReferralState', id: address.toLowerCase() }, 'ReferralState']
    }),
    claimReferralReward: builder.mutation<ReferralStateResponse, { address: string; rewardId: string }>({
      query: ({ address, rewardId }) => ({
        url: `/referrals/${encodeURIComponent(address.toLowerCase())}/rewards/${encodeURIComponent(rewardId)}/claim`,
        method: 'POST'
      }),
      invalidatesTags: (_result, _error, { address }) => [{ type: 'ReferralState', id: address.toLowerCase() }]
    })
  })
})

const { useGetReferralStateQuery, useClaimReferralRewardMutation } = profileReferralsApi

export { profileReferralsApi, useClaimReferralRewardMutation, useGetReferralStateQuery }
export type { ReferralReward, ReferralStateResponse, ReferralTier }
