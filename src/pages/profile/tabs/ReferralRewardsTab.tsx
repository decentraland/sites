import { Referrals } from '../../../components/profile/Referrals'

interface ReferralRewardsTabProps {
  address: string
}

function ReferralRewardsTab({ address }: ReferralRewardsTabProps) {
  return <Referrals profileAddress={address} />
}

export { ReferralRewardsTab }
export type { ReferralRewardsTabProps }
