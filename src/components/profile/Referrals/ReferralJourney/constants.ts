import { Rarity } from '@dcl/schemas'
import type { ReferralTier } from './ReferralJourney.types'

const TIERS: ReferralTier[] = [
  {
    invitesAccepted: 5,
    rarity: Rarity.EPIC,
    image: '/images/referrals/tier_1.webp',
    description: 'RainbowWave Jeans + Community Recruiter Starter Badge'
  },
  {
    invitesAccepted: 10,
    rarity: Rarity.EPIC,
    image: '/images/referrals/tier_2.webp',
    description: 'Good Vibes Letterman + Community Recruiter Bronze Badge'
  },
  { invitesAccepted: 20, rarity: Rarity.LEGENDARY, image: '/images/referrals/tier_3.webp', description: 'Signal Surge Gloves' },
  {
    invitesAccepted: 25,
    rarity: Rarity.LEGENDARY,
    image: '/images/referrals/tier_4.webp',
    description: 'Postman Emote + Community Recruiter Silver Badge'
  },
  { invitesAccepted: 30, rarity: Rarity.EXOTIC, image: '/images/referrals/tier_5.webp', description: 'Afterglow Kicks' },
  {
    invitesAccepted: 50,
    rarity: Rarity.EXOTIC,
    image: '/images/referrals/tier_6.webp',
    description: 'Spunky MopTop + Community Recruiter Gold Badge'
  },
  { invitesAccepted: 60, rarity: Rarity.MYTHIC, image: '/images/referrals/tier_7.webp', description: 'Volty Vibes Shoulder Companion' },
  {
    invitesAccepted: 75,
    rarity: Rarity.MYTHIC,
    image: '/images/referrals/tier_8.webp',
    description: 'Monocycle Emote + Community Recruiter Platinum Badge'
  },
  {
    invitesAccepted: 100,
    rarity: 'SWAG',
    image: '/images/referrals/tier_9.webp',
    description: 'IRL Swag Pack + In-World Wearable + Community Recruiter Diamond Badge'
  }
]

export { TIERS }
