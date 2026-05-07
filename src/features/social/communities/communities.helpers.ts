import type { Theme } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import type { RarityPalette } from './communities.helpers.types'
import { Role } from './communities.types'

function getThumbnailUrl(communityId?: string): string | undefined {
  if (!communityId) return undefined
  const cdn = getEnv('ASSETS_CDN_URL')
  if (!cdn) return undefined
  return `${cdn}/social/communities/${encodeURIComponent(communityId)}/raw-thumbnail.png`
}

function isMember(community?: { role?: Role }): boolean {
  return !!community?.role && community.role !== Role.NONE
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

export { getRarityColor, getThumbnailUrl, isMember }
