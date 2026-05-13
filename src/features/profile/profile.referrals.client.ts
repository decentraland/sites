import { referralClient } from '../../services/referralClient'

interface ReferralRewardImage {
  tier: number
  url: string
}

interface ReferralProgressResponse {
  /** Total invitees who have accepted (used to compute the current tier). */
  invitedUsersAccepted: number
  /** Invitees the user has already viewed in the UI (not used here yet). */
  invitedUsersAcceptedViewed: number
  rewardImages: ReferralRewardImage[]
}

const profileReferralsApi = referralClient.injectEndpoints({
  endpoints: builder => ({
    // The endpoint is identity-scoped — the signed fetch attaches the auth
    // chain and the server returns the caller's own progress. There is no
    // `:address` parameter, so this only renders for own profile.
    getReferralProgress: builder.query<ReferralProgressResponse, void>({
      query: () => '/v1/referral-progress',
      providesTags: ['ReferralState']
    })
  })
})

const { useGetReferralProgressQuery } = profileReferralsApi

export { profileReferralsApi, useGetReferralProgressQuery }
export type { ReferralProgressResponse, ReferralRewardImage }
