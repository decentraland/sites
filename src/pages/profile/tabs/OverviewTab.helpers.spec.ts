import { Network, Rarity } from '@dcl/schemas'
import type { CollectibleDetail } from '../../../features/profile/profile.wearables.client'
import {
  detectLinkProvider,
  extractAchievedTierDescription,
  formatBadgeDate,
  formatPriceMana,
  getEquippedWearables,
  readField,
  safeLinkUrl,
  toCatalogAsset,
  toItemNetwork,
  toRarity
} from './OverviewTab.helpers'
import type { AvatarSnapshot } from './OverviewTab.types'

describe('OverviewTab.helpers', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when normalizing a rarity', () => {
    describe('and the value is a recognized rarity', () => {
      it('should pass the rarity through verbatim', () => {
        expect(toRarity(Rarity.LEGENDARY)).toBe(Rarity.LEGENDARY)
      })
    })

    describe('and the value is an unknown rarity', () => {
      it('should fall back to COMMON', () => {
        expect(toRarity('not-a-rarity')).toBe(Rarity.COMMON)
      })
    })

    describe('and the value is undefined', () => {
      it('should fall back to COMMON', () => {
        expect(toRarity(undefined)).toBe(Rarity.COMMON)
      })
    })
  })

  describe('when normalizing a network', () => {
    describe('and the value is ethereum', () => {
      it('should return ETHEREUM', () => {
        expect(toItemNetwork(Network.ETHEREUM)).toBe(Network.ETHEREUM)
      })
    })

    describe('and the value is anything other than ethereum', () => {
      it('should default to MATIC', () => {
        expect(toItemNetwork('SOMETHING_ELSE')).toBe(Network.MATIC)
      })
    })

    describe('and the value is undefined', () => {
      it('should default to MATIC', () => {
        expect(toItemNetwork(undefined)).toBe(Network.MATIC)
      })
    })
  })

  describe('when mapping a collectible to a catalog asset', () => {
    describe('and the collectible has a recognized rarity and network', () => {
      let item: CollectibleDetail

      beforeEach(() => {
        item = {
          urn: 'urn:decentraland:matic:collections-v2:0xabc:1',
          name: 'Cool Hat',
          thumbnail: 'https://img.test/hat.png',
          rarity: Rarity.EPIC,
          contractAddress: '0xabc',
          itemId: '1',
          network: 'ETHEREUM',
          marketplaceUrl: 'https://decentraland.org/marketplace/item',
          creator: '0xcreator',
          isOnSale: true
        }
      })

      it('should project the urn, marketplace url, name, normalized rarity/network and creator', () => {
        expect(toCatalogAsset(item)).toEqual({
          id: item.urn,
          url: item.marketplaceUrl,
          name: 'Cool Hat',
          rarity: Rarity.EPIC,
          network: Network.ETHEREUM,
          creator: '0xcreator'
        })
      })
    })

    describe('and the collectible has an unknown rarity and a non-ethereum network', () => {
      let item: CollectibleDetail

      beforeEach(() => {
        item = {
          urn: 'urn:test',
          name: 'Mystery',
          thumbnail: '',
          contractAddress: '0x0',
          itemId: '0',
          network: 'MATIC',
          marketplaceUrl: '',
          creator: '0x0',
          isOnSale: false
        }
      })

      it('should coerce the rarity to COMMON', () => {
        expect(toCatalogAsset(item).rarity).toBe(Rarity.COMMON)
      })

      it('should coerce the network to MATIC', () => {
        expect(toCatalogAsset(item).network).toBe(Network.MATIC)
      })
    })
  })

  describe('when reading equipped wearables', () => {
    describe('and the wearables array is present', () => {
      let avatar: AvatarSnapshot

      beforeEach(() => {
        avatar = { avatar: { wearables: ['a', 'b'] } } as unknown as AvatarSnapshot
      })

      it('should return the wearables array', () => {
        expect(getEquippedWearables(avatar)).toEqual(['a', 'b'])
      })
    })

    describe('and the avatar is undefined', () => {
      it('should return an empty array', () => {
        expect(getEquippedWearables(undefined)).toEqual([])
      })
    })

    describe('and the wearables are missing', () => {
      let avatar: AvatarSnapshot

      beforeEach(() => {
        avatar = { avatar: {} } as unknown as AvatarSnapshot
      })

      it('should return an empty array', () => {
        expect(getEquippedWearables(avatar)).toEqual([])
      })
    })
  })

  describe('when reading a string field from the avatar', () => {
    describe('and the field is a non-empty string', () => {
      let avatar: AvatarSnapshot

      beforeEach(() => {
        avatar = { country: 'Argentina' } as unknown as AvatarSnapshot
      })

      it('should return the string value', () => {
        expect(readField(avatar, 'country')).toBe('Argentina')
      })
    })

    describe('and the avatar is undefined', () => {
      it('should return undefined', () => {
        expect(readField(undefined, 'country')).toBeUndefined()
      })
    })

    describe('and the field is an empty string', () => {
      let avatar: AvatarSnapshot

      beforeEach(() => {
        avatar = { country: '' } as unknown as AvatarSnapshot
      })

      it('should return undefined', () => {
        expect(readField(avatar, 'country')).toBeUndefined()
      })
    })

    describe('and the field is not a string', () => {
      let avatar: AvatarSnapshot

      beforeEach(() => {
        avatar = { country: 42 } as unknown as AvatarSnapshot
      })

      it('should return undefined', () => {
        expect(readField(avatar, 'country')).toBeUndefined()
      })
    })
  })

  describe('when formatting a badge date', () => {
    describe('and the value is a numeric timestamp', () => {
      let timestamp: number

      beforeEach(() => {
        timestamp = Date.UTC(2024, 0, 15)
      })

      it('should return a formatted string containing the year', () => {
        expect(formatBadgeDate(timestamp)).toContain('2024')
      })
    })

    describe('and the value is a numeric string timestamp', () => {
      let timestamp: string

      beforeEach(() => {
        timestamp = String(Date.UTC(2024, 0, 15))
      })

      it('should return a formatted string containing the year', () => {
        expect(formatBadgeDate(timestamp)).toContain('2024')
      })
    })

    describe('and the value is undefined', () => {
      it('should return undefined', () => {
        expect(formatBadgeDate(undefined)).toBeUndefined()
      })
    })

    describe('and the value is null', () => {
      it('should return undefined', () => {
        expect(formatBadgeDate(null)).toBeUndefined()
      })
    })

    describe('and the value is an empty string', () => {
      it('should return undefined', () => {
        expect(formatBadgeDate('')).toBeUndefined()
      })
    })

    describe('and the value parses to a non-finite number', () => {
      it('should return undefined', () => {
        expect(formatBadgeDate('not-a-number')).toBeUndefined()
      })
    })
  })

  describe('when extracting the achieved tier description', () => {
    describe('and there is no description', () => {
      it('should return undefined', () => {
        expect(extractAchievedTierDescription(undefined, 'Bronze')).toBeUndefined()
      })
    })

    describe('and there is no tier name', () => {
      let description: string

      beforeEach(() => {
        description = 'A flat blurb'
      })

      it('should return the full description', () => {
        expect(extractAchievedTierDescription(description, undefined)).toBe('A flat blurb')
      })
    })

    describe('and a chunk matches the achieved tier', () => {
      let description: string

      beforeEach(() => {
        description = 'Bronze: 50 scenes;Silver: 250 scenes;Gold: 1000 scenes'
      })

      it('should surface only the matching tier blurb', () => {
        expect(extractAchievedTierDescription(description, 'Silver')).toBe('250 scenes')
      })
    })

    describe('and the tier name matches a chunk only case-insensitively', () => {
      let description: string

      beforeEach(() => {
        description = 'Bronze: 50 scenes;Silver: 250 scenes'
      })

      it('should match the tier name case-insensitively', () => {
        expect(extractAchievedTierDescription(description, 'silver')).toBe('250 scenes')
      })
    })

    describe('and no chunk matches the tier', () => {
      let description: string

      beforeEach(() => {
        description = 'Bronze: 50 scenes;Silver: 250 scenes'
      })

      it('should fall back to the full description', () => {
        expect(extractAchievedTierDescription(description, 'Platinum')).toBe(description)
      })
    })

    describe('and the matched chunk has an empty blurb', () => {
      let description: string

      beforeEach(() => {
        description = 'Bronze:'
      })

      it('should fall back to the full description', () => {
        expect(extractAchievedTierDescription(description, 'Bronze')).toBe(description)
      })
    })
  })

  describe('when detecting a link provider from a url', () => {
    describe('and the url has a plain second-level domain', () => {
      it('should capitalize the second-level domain', () => {
        expect(detectLinkProvider('https://twitter.com/brai')).toBe('Twitter')
      })
    })

    describe('and the url has a www prefix', () => {
      it('should strip the www prefix before capitalizing', () => {
        expect(detectLinkProvider('https://www.github.com/brai')).toBe('Github')
      })
    })

    describe('and the url is unparseable', () => {
      it('should return the raw value', () => {
        expect(detectLinkProvider('not a url')).toBe('not a url')
      })
    })
  })

  describe('when validating a profile link url', () => {
    describe('and the value is an https url', () => {
      it('should allow it and return its normalized form', () => {
        expect(safeLinkUrl('https://decentraland.org')).toBe('https://decentraland.org/')
      })
    })

    describe('and the value is an http url', () => {
      it('should allow it and return its normalized form', () => {
        expect(safeLinkUrl('http://decentraland.org')).toBe('http://decentraland.org/')
      })
    })

    describe('and the value is a javascript: payload', () => {
      it('should reject it', () => {
        expect(safeLinkUrl('javascript:alert(1)')).toBeNull()
      })
    })

    describe('and the value is a data: payload', () => {
      it('should reject it', () => {
        expect(safeLinkUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
      })
    })

    describe('and the value is an unparseable url', () => {
      it('should return null', () => {
        expect(safeLinkUrl('http://')).toBeNull()
      })
    })

    describe('and the value is an empty string', () => {
      it('should return null', () => {
        expect(safeLinkUrl('')).toBeNull()
      })
    })

    describe('and the value is null', () => {
      it('should return null', () => {
        expect(safeLinkUrl(null)).toBeNull()
      })
    })

    describe('and the value is a non-string', () => {
      it('should return null', () => {
        expect(safeLinkUrl(123 as unknown as string)).toBeNull()
      })
    })
  })

  describe('when formatting a price from wei to MANA', () => {
    describe('and the price is a whole number', () => {
      it('should format it with thousands separators', () => {
        expect(formatPriceMana('5000000000000000000')).toBe('5')
      })
    })

    describe('and the price is a large whole number', () => {
      it('should format it with thousands separators', () => {
        expect(formatPriceMana('1000000000000000000000')).toBe('1,000')
      })
    })

    describe('and the price has up to two fractional digits', () => {
      it('should keep the fraction and trim trailing zeros', () => {
        expect(formatPriceMana('1500000000000000000')).toBe('1.5')
      })
    })

    describe('and the price has more than two fractional digits', () => {
      it('should truncate the fractional part to two digits', () => {
        expect(formatPriceMana('1234560000000000000')).toBe('1.23')
      })
    })

    describe('and the price is zero wei', () => {
      it('should treat it as no price', () => {
        expect(formatPriceMana('0')).toBeUndefined()
      })
    })

    describe('and the price is undefined', () => {
      it('should return undefined', () => {
        expect(formatPriceMana(undefined)).toBeUndefined()
      })
    })

    describe('and the price is an unparseable wei string', () => {
      it('should return undefined', () => {
        expect(formatPriceMana('not-wei')).toBeUndefined()
      })
    })
  })
})
