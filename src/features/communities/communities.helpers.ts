import type { Theme } from 'decentraland-ui2'
import { getEnv } from '../../config/env'
import { truncateAddress } from '../../utils/address'
import type { ProfileSummary } from '../profile/profile.types'
import type { CommunityMemberCard, RarityPalette } from './communities.helpers.types'
import { Role } from './communities.types'
import type { CommunityMember } from './communities.types'

function getThumbnailUrl(communityId?: string): string | undefined {
  if (!communityId) return undefined
  const cdn = getEnv('ASSETS_CDN_URL')
  if (!cdn) return undefined
  return `${cdn}/social/communities/${encodeURIComponent(communityId)}/raw-thumbnail.png`
}

function isMember(community?: { role?: Role }): boolean {
  return !!community?.role && community.role !== Role.NONE
}

// The members endpoint is address-only, so the display fields come from a batched
// Catalyst lookup. A member whose profile is still in flight is flagged so the row can
// show a skeleton; one without a profile keeps their row and shows their address, in the
// same truncated form the owner row uses. A full address is one unbreakable token: it
// overflows the fixed-width members column and the scroll container clips it mid-string.
function toMemberCards(members: CommunityMember[], profiles: Map<string, ProfileSummary>): CommunityMemberCard[] {
  return members.map(member => {
    const key = member.memberAddress.toLowerCase()
    const profile = profiles.get(key)
    return {
      memberAddress: member.memberAddress,
      name: profile?.name ?? truncateAddress(member.memberAddress),
      role: member.role,
      profilePictureUrl: profile?.avatarFace256 ?? '',
      hasClaimedName: profile?.hasClaimedName ?? false,
      isLoadingProfile: !profiles.has(key)
    }
  })
}

// Hash a string to a 32-bit unsigned integer (FNV-1a). Used to seed deterministic
// rarity color picks per address — same input always produces the same color so
// member/attendee avatars don't flicker between renders.
function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function getRarityColor(theme: Theme, seed: string): string {
  const palette = theme.palette as Theme['palette'] & {
    raritiesText?: RarityPalette
    rarities?: RarityPalette
  }
  const source = palette.raritiesText ?? palette.rarities ?? {}
  const colors = Object.values(source).filter((color): color is string => Boolean(color))
  if (colors.length === 0) return theme.palette.secondary.main
  return colors[hashString(seed) % colors.length]
}

export { getRarityColor, getThumbnailUrl, isMember, toMemberCards }
