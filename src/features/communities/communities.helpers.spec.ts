import type { Theme } from 'decentraland-ui2'
import { getRarityColor, getThumbnailUrl, isMember } from './communities.helpers'
import { Role } from './communities.types'

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
})
