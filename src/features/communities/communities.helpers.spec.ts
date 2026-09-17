import type { Theme } from 'decentraland-ui2'
import type { ProfileSummary } from '../profile/profile.types'
import { getRarityColor, getThumbnailUrl, isMember, toMemberCards } from './communities.helpers'
import { Role } from './communities.types'
import type { CommunityMember } from './communities.types'

jest.mock('../../config/env', () => ({
  getEnv: (key: string) => (key === 'ASSETS_CDN_URL' ? 'https://cdn.test' : undefined)
}))

describe('communities.helpers', () => {
  describe('getThumbnailUrl', () => {
    describe('when called with a community id', () => {
      it('should return the CDN thumbnail URL with the id encoded', () => {
        expect(getThumbnailUrl('abc-123')).toBe('https://cdn.test/social/communities/abc-123/raw-thumbnail.png')
      })

      it('should percent-encode unsafe characters in the id', () => {
        expect(getThumbnailUrl('weird id?#')).toBe('https://cdn.test/social/communities/weird%20id%3F%23/raw-thumbnail.png')
      })
    })

    describe('when called without an id', () => {
      it('should return undefined', () => {
        expect(getThumbnailUrl()).toBeUndefined()
      })
    })
  })

  describe('isMember', () => {
    describe('when role is missing', () => {
      it('should return false', () => {
        expect(isMember({})).toBe(false)
      })
    })

    describe('when role is NONE', () => {
      it('should return false', () => {
        expect(isMember({ role: Role.NONE })).toBe(false)
      })
    })

    describe('when role is set to a non-NONE value', () => {
      it('should return true', () => {
        expect(isMember({ role: Role.MEMBER })).toBe(true)
        expect(isMember({ role: Role.OWNER })).toBe(true)
        expect(isMember({ role: Role.MODERATOR })).toBe(true)
      })
    })
  })

  describe('getRarityColor', () => {
    describe('when raritiesText is available', () => {
      it('should return a color from the palette deterministically by seed', () => {
        const theme = {
          palette: {
            secondary: { main: '#000000' },
            raritiesText: { epic: '#FFA500', legendary: '#800080' }
          }
        } as unknown as Theme
        const color = getRarityColor(theme, '0xseed')
        expect(['#FFA500', '#800080']).toContain(color)
        expect(getRarityColor(theme, '0xseed')).toBe(color)
      })
    })

    describe('when raritiesText is missing but rarities is set', () => {
      it('should fall back to rarities', () => {
        const theme = {
          palette: { secondary: { main: '#000000' }, rarities: { rare: '#00FF00' } }
        } as unknown as Theme
        expect(getRarityColor(theme, '0xseed')).toBe('#00FF00')
      })
    })

    describe('when no rarities are configured', () => {
      it('should fall back to the secondary main color', () => {
        const theme = {
          palette: { secondary: { main: '#ABCDEF' } }
        } as unknown as Theme
        expect(getRarityColor(theme, '0xseed')).toBe('#ABCDEF')
      })
    })
  })

  describe('toMemberCards', () => {
    // Full-length addresses: the fallback truncates, and a short stub would pass through
    // unchanged without ever exercising it.
    const ownerAddress = '0xAbCdEf0123456789AbCdEf0123456789AbCdEf01'
    const memberAddress = '0xFeDcBa9876543210FeDcBa9876543210FeDcBa98'
    let members: CommunityMember[]
    let profiles: Map<string, ProfileSummary>

    beforeEach(() => {
      members = [
        { communityId: 'c-1', memberAddress: ownerAddress, role: Role.OWNER, joinedAt: '2026-01-01T00:00:00Z' },
        { communityId: 'c-1', memberAddress, role: Role.MEMBER, joinedAt: '2026-01-02T00:00:00Z' }
      ]
      profiles = new Map()
    })

    describe('when a member has a resolved profile', () => {
      beforeEach(() => {
        profiles.set(ownerAddress.toLowerCase(), {
          address: ownerAddress.toLowerCase(),
          name: 'mojito',
          hasClaimedName: true,
          avatarFace256: 'https://cdn.test/face.png'
        })
      })

      it('should use the profile name, face and claimed-name flag', () => {
        expect(toMemberCards(members, profiles)[0]).toEqual({
          memberAddress: ownerAddress,
          name: 'mojito',
          role: Role.OWNER,
          profilePictureUrl: 'https://cdn.test/face.png',
          hasClaimedName: true,
          isLoadingProfile: false
        })
      })
    })

    describe('when a member profile is still in flight', () => {
      it('should keep the row, flag it as loading and show the truncated address meanwhile', () => {
        expect(toMemberCards(members, profiles)[1]).toEqual({
          memberAddress,
          name: '0xFeDc…Ba98',
          role: Role.MEMBER,
          profilePictureUrl: '',
          hasClaimedName: false,
          isLoadingProfile: true
        })
      })

      it('should not drop the member from the result', () => {
        expect(toMemberCards(members, profiles)).toHaveLength(2)
      })
    })

    describe('when a member settled without a deployed profile', () => {
      beforeEach(() => {
        profiles.set(ownerAddress.toLowerCase(), { address: ownerAddress.toLowerCase(), hasClaimedName: false })
      })

      it('should fall back per field and stop loading', () => {
        expect(toMemberCards(members, profiles)[0]).toEqual({
          memberAddress: ownerAddress,
          name: '0xAbCd…Ef01',
          role: Role.OWNER,
          profilePictureUrl: '',
          hasClaimedName: false,
          isLoadingProfile: false
        })
      })

      it('should keep the full address on the card, which keys the row and seeds its avatar colour', () => {
        expect(toMemberCards(members, profiles)[0].memberAddress).toBe(ownerAddress)
      })
    })

    describe('when there are no members', () => {
      it('should return an empty list', () => {
        expect(toMemberCards([], profiles)).toEqual([])
      })
    })
  })
})
