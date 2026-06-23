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
  describe('when normalizing a rarity', () => {
    it('should pass through a recognized rarity verbatim', () => {
      expect(toRarity(Rarity.LEGENDARY)).toBe(Rarity.LEGENDARY)
    })

    it('should fall back to COMMON for an unknown rarity', () => {
      expect(toRarity('not-a-rarity')).toBe(Rarity.COMMON)
    })

    it('should fall back to COMMON for an undefined rarity', () => {
      expect(toRarity(undefined)).toBe(Rarity.COMMON)
    })
  })

  describe('when normalizing a network', () => {
    it('should return ETHEREUM when the value is ethereum', () => {
      expect(toItemNetwork(Network.ETHEREUM)).toBe(Network.ETHEREUM)
    })

    it('should default to MATIC for any other value', () => {
      expect(toItemNetwork('SOMETHING_ELSE')).toBe(Network.MATIC)
    })

    it('should default to MATIC for an undefined value', () => {
      expect(toItemNetwork(undefined)).toBe(Network.MATIC)
    })
  })

  describe('when mapping a collectible to a catalog asset', () => {
    it('should project the URN, marketplace url, name, normalized rarity/network and creator', () => {
      const item: CollectibleDetail = {
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

      expect(toCatalogAsset(item)).toEqual({
        id: item.urn,
        url: item.marketplaceUrl,
        name: 'Cool Hat',
        rarity: Rarity.EPIC,
        network: Network.ETHEREUM,
        creator: '0xcreator'
      })
    })

    it('should coerce an unknown rarity and non-ethereum network to their fallbacks', () => {
      const item: CollectibleDetail = {
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

      const asset = toCatalogAsset(item)
      expect(asset.rarity).toBe(Rarity.COMMON)
      expect(asset.network).toBe(Network.MATIC)
    })
  })

  describe('when reading equipped wearables', () => {
    it('should return the wearables array when present', () => {
      const avatar = { avatar: { wearables: ['a', 'b'] } } as unknown as AvatarSnapshot
      expect(getEquippedWearables(avatar)).toEqual(['a', 'b'])
    })

    it('should return an empty array when the avatar is undefined', () => {
      expect(getEquippedWearables(undefined)).toEqual([])
    })

    it('should return an empty array when wearables are missing', () => {
      const avatar = { avatar: {} } as unknown as AvatarSnapshot
      expect(getEquippedWearables(avatar)).toEqual([])
    })
  })

  describe('when reading a string field from the avatar', () => {
    it('should return the trimmed-string value when it is a non-empty string', () => {
      const avatar = { country: 'Argentina' } as unknown as AvatarSnapshot
      expect(readField(avatar, 'country')).toBe('Argentina')
    })

    it('should return undefined when the avatar is undefined', () => {
      expect(readField(undefined, 'country')).toBeUndefined()
    })

    it('should return undefined when the field is an empty string', () => {
      const avatar = { country: '' } as unknown as AvatarSnapshot
      expect(readField(avatar, 'country')).toBeUndefined()
    })

    it('should return undefined when the field is not a string', () => {
      const avatar = { country: 42 } as unknown as AvatarSnapshot
      expect(readField(avatar, 'country')).toBeUndefined()
    })
  })

  describe('when formatting a badge date', () => {
    it('should format a numeric timestamp', () => {
      const result = formatBadgeDate(Date.UTC(2024, 0, 15))
      expect(result).toEqual(expect.any(String))
      expect(result).toContain('2024')
    })

    it('should parse a numeric string timestamp', () => {
      const result = formatBadgeDate(String(Date.UTC(2024, 0, 15)))
      expect(result).toContain('2024')
    })

    it('should return undefined for undefined', () => {
      expect(formatBadgeDate(undefined)).toBeUndefined()
    })

    it('should return undefined for null', () => {
      expect(formatBadgeDate(null)).toBeUndefined()
    })

    it('should return undefined for an empty string', () => {
      expect(formatBadgeDate('')).toBeUndefined()
    })

    it('should return undefined for a non-finite parsed value', () => {
      expect(formatBadgeDate('not-a-number')).toBeUndefined()
    })
  })

  describe('when extracting the achieved tier description', () => {
    it('should return undefined when there is no description', () => {
      expect(extractAchievedTierDescription(undefined, 'Bronze')).toBeUndefined()
    })

    it('should return the full description when there is no tier name', () => {
      expect(extractAchievedTierDescription('A flat blurb', undefined)).toBe('A flat blurb')
    })

    it('should surface only the blurb matching the achieved tier', () => {
      const description = 'Bronze: 50 scenes;Silver: 250 scenes;Gold: 1000 scenes'
      expect(extractAchievedTierDescription(description, 'Silver')).toBe('250 scenes')
    })

    it('should match the tier name case-insensitively', () => {
      const description = 'Bronze: 50 scenes;Silver: 250 scenes'
      expect(extractAchievedTierDescription(description, 'silver')).toBe('250 scenes')
    })

    it('should fall back to the full description when no chunk matches the tier', () => {
      const description = 'Bronze: 50 scenes;Silver: 250 scenes'
      expect(extractAchievedTierDescription(description, 'Platinum')).toBe(description)
    })

    it('should fall back to the full description when the matched chunk has an empty blurb', () => {
      const description = 'Bronze:'
      expect(extractAchievedTierDescription(description, 'Bronze')).toBe(description)
    })
  })

  describe('when detecting a link provider from a url', () => {
    it('should capitalize the second-level domain', () => {
      expect(detectLinkProvider('https://twitter.com/brai')).toBe('Twitter')
    })

    it('should strip a www prefix before capitalizing', () => {
      expect(detectLinkProvider('https://www.github.com/brai')).toBe('Github')
    })

    it('should return the raw value when the url is unparseable', () => {
      expect(detectLinkProvider('not a url')).toBe('not a url')
    })
  })

  describe('when validating a profile link url', () => {
    it('should allow an https url and return its normalized form', () => {
      expect(safeLinkUrl('https://decentraland.org')).toBe('https://decentraland.org/')
    })

    it('should allow an http url', () => {
      expect(safeLinkUrl('http://decentraland.org')).toBe('http://decentraland.org/')
    })

    it('should reject a javascript: payload', () => {
      expect(safeLinkUrl('javascript:alert(1)')).toBeNull()
    })

    it('should reject a data: payload', () => {
      expect(safeLinkUrl('data:text/html,<script>alert(1)</script>')).toBeNull()
    })

    it('should return null for an unparseable url', () => {
      expect(safeLinkUrl('http://')).toBeNull()
    })

    it('should return null for an empty value', () => {
      expect(safeLinkUrl('')).toBeNull()
    })

    it('should return null for a null value', () => {
      expect(safeLinkUrl(null)).toBeNull()
    })

    it('should return null for a non-string value', () => {
      expect(safeLinkUrl(123 as unknown as string)).toBeNull()
    })
  })

  describe('when formatting a price from wei to MANA', () => {
    it('should format a whole-number price with thousands separators', () => {
      expect(formatPriceMana('5000000000000000000')).toBe('5')
    })

    it('should format a large whole-number price', () => {
      expect(formatPriceMana('1000000000000000000000')).toBe('1,000')
    })

    it('should keep up to two fractional digits and trim trailing zeros', () => {
      // 1.5 MANA in wei
      expect(formatPriceMana('1500000000000000000')).toBe('1.5')
    })

    it('should truncate the fractional part to two digits', () => {
      // 1.23456 MANA in wei
      expect(formatPriceMana('1234560000000000000')).toBe('1.23')
    })

    it('should treat 0 wei as no price', () => {
      expect(formatPriceMana('0')).toBeUndefined()
    })

    it('should return undefined for an undefined input', () => {
      expect(formatPriceMana(undefined)).toBeUndefined()
    })

    it('should return undefined for an unparseable wei string', () => {
      expect(formatPriceMana('not-wei')).toBeUndefined()
    })
  })
})
