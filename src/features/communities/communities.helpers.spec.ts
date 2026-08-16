import type { Theme } from 'decentraland-ui2'
import type { Profile } from '../cast2/peer'
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
    let members: CommunityMember[]
    let profiles: Map<string, Profile>

    beforeEach(() => {
      members = [
        { communityId: 'c-1', memberAddress: '0xAAA', role: Role.OWNER, joinedAt: '2026-01-01T00:00:00Z' },
        { communityId: 'c-1', memberAddress: '0xBBB', role: Role.MEMBER, joinedAt: '2026-01-02T00:00:00Z' }
      ]
      profiles = new Map()
    })

    describe('when a member has a resolved profile', () => {
      beforeEach(() => {
        profiles.set('0xaaa', { address: '0xaaa', name: 'mojito', hasClaimedName: true, avatarFace256: 'https://cdn.test/face.png' })
      })

      it('should use the profile name, face and claimed-name flag', () => {
        expect(toMemberCards(members, profiles)[0]).toEqual({
          memberAddress: '0xAAA',
          name: 'mojito',
          role: Role.OWNER,
          profilePictureUrl: 'https://cdn.test/face.png',
          hasClaimedName: true
        })
      })
    })

    describe('when a member has no profile', () => {
      it('should keep the row and fall back to the address with an empty picture', () => {
        expect(toMemberCards(members, profiles)[1]).toEqual({
          memberAddress: '0xBBB',
          name: '0xBBB',
          role: Role.MEMBER,
          profilePictureUrl: '',
          hasClaimedName: false
        })
      })

      it('should not drop the member from the result', () => {
        expect(toMemberCards(members, profiles)).toHaveLength(2)
      })
    })

    describe('when a resolved profile only has some fields', () => {
      beforeEach(() => {
        profiles.set('0xaaa', { address: '0xaaa', hasClaimedName: false })
      })

      it('should fall back per field', () => {
        expect(toMemberCards(members, profiles)[0]).toEqual({
          memberAddress: '0xAAA',
          name: '0xAAA',
          role: Role.OWNER,
          profilePictureUrl: '',
          hasClaimedName: false
        })
      })
    })

    describe('when there are no members', () => {
      it('should return an empty list', () => {
        expect(toMemberCards([], profiles)).toEqual([])
      })
    })
  })
})
