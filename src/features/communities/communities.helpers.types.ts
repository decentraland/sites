type RarityPalette = Partial<Record<string, string | undefined>>

type CommunityMemberCard = {
  memberAddress: string
  name: string
  role: string
  profilePictureUrl: string
  hasClaimedName?: boolean
}

export type { CommunityMemberCard, RarityPalette }
