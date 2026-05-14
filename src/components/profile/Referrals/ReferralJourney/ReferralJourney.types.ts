import type { Rarity } from '@dcl/schemas'

enum AnimationPhase {
  TIER_REACHED = 'tier_reached',
  WAITING_NEXT_TIER = 'waiting_next_tier'
}

interface ReferralTier {
  invitesAccepted: number
  rarity: Rarity | 'SWAG'
  image: string
  description: string
}

interface RewardImage {
  tier: number
  url: string
}

interface ReferralJourneyProps {
  invitedUsersAccepted: number
  invitedUsersAcceptedViewed: number
  rewardImages: RewardImage[]
}

export { AnimationPhase }
export type { ReferralJourneyProps, ReferralTier, RewardImage }
