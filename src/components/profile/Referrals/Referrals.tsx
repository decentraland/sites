import { skipToken } from '@reduxjs/toolkit/query'
import { CircularProgress, Typography } from 'decentraland-ui2'
import { useGetReferralProgressQuery } from '../../../features/profile/profile.referrals.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useProfileAvatar } from '../../../hooks/useProfileAvatar'
import { ReferralHeroSection } from './ReferralHeroSection'
import { ReferralJourney } from './ReferralJourney'
import { ReferralHeroContainer, ReferralJourneySectionContainer, ReferralsContainer } from './Referrals.styled'

interface ReferralsProps {
  profileAddress: string
}

function Referrals({ profileAddress }: ReferralsProps) {
  const t = useFormatMessage()
  const { avatar } = useProfileAvatar(profileAddress)
  const { address, hasValidIdentity } = useAuthIdentity()
  const {
    currentData: data,
    isLoading,
    error
  } = useGetReferralProgressQuery(
    hasValidIdentity && address?.toLowerCase() === profileAddress.toLowerCase() ? { address: address.toLowerCase() } : skipToken
  )

  if (isLoading) {
    return (
      <ReferralsContainer>
        <CircularProgress size={28} />
      </ReferralsContainer>
    )
  }

  if (error || !data) {
    return (
      <ReferralsContainer>
        <Typography variant="body2" color="text.disabled">
          {t('profile.referral_rewards.anonymous')}
        </Typography>
      </ReferralsContainer>
    )
  }

  return (
    <ReferralsContainer>
      <ReferralHeroContainer>
        <ReferralHeroSection profileAddress={profileAddress} avatarName={avatar?.name} hasClaimedName={avatar?.hasClaimedName} />
      </ReferralHeroContainer>
      <ReferralJourneySectionContainer>
        <ReferralJourney
          invitedUsersAccepted={data.invitedUsersAccepted}
          invitedUsersAcceptedViewed={data.invitedUsersAcceptedViewed}
          rewardImages={data.rewardImages}
        />
      </ReferralJourneySectionContainer>
    </ReferralsContainer>
  )
}

export { Referrals }
export type { ReferralsProps }
