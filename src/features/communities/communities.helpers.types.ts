import type { Role } from './communities.types'

type RarityPalette = Partial<Record<string, string | undefined>>

type CommunityMemberCard = {
  memberAddress: string
  name: string
  role: Role
  profilePictureUrl: string
  hasClaimedName?: boolean
  isLoadingProfile: boolean
}

export type { CommunityMemberCard, RarityPalette }
