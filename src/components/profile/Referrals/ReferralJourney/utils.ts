import { TIERS } from './constants'

const ANIMATION_DURATION = 800

const SEGMENT_PERCENTAGE = 11.1
const OFFSET = 5

const calculateProgressPercentage = (totalSteps: number, invitedUsersAccepted: number): number => {
  if (totalSteps <= 0) return 0

  if (invitedUsersAccepted <= TIERS[0].invitesAccepted) {
    return invitedUsersAccepted
  }

  if (invitedUsersAccepted >= TIERS[TIERS.length - 1].invitesAccepted) {
    return totalSteps * SEGMENT_PERCENTAGE
  }

  let prevTierIndex = 0
  for (let i = 0; i < TIERS.length; i++) {
    if (invitedUsersAccepted < TIERS[i].invitesAccepted) {
      prevTierIndex = i - 1
      break
    }
  }
  const prevTier = TIERS[prevTierIndex]
  const nextTier = TIERS[prevTierIndex + 1]
  const invitesNeeded = nextTier.invitesAccepted - prevTier.invitesAccepted
  const invitesProgress = invitedUsersAccepted - prevTier.invitesAccepted
  const progressPercentage = (invitesProgress / invitesNeeded) * SEGMENT_PERCENTAGE
  const basePercentage = prevTierIndex * SEGMENT_PERCENTAGE + OFFSET
  return basePercentage + progressPercentage
}

const getTiersCompletedCount = (invitedUsersAccepted: number): number => {
  return TIERS.filter(tier => tier.invitesAccepted <= invitedUsersAccepted).length
}

export { ANIMATION_DURATION, calculateProgressPercentage, getTiersCompletedCount }
