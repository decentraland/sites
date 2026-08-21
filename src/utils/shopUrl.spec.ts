import { getEnv } from '../config/env'
import { isShopCategory, shopItemUrl, shopTokenUrl } from './shopUrl'

jest.mock('../config/env')

const mockGetEnv = getEnv as jest.MockedFunction<typeof getEnv>

describe('shopUrl', () => {
  beforeEach(() => {
    mockGetEnv.mockReturnValue('https://decentraland.zone/shop')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when building an item url', () => {
    it('should point at the shop route for that item', () => {
      expect(shopItemUrl('0xabc', '7')).toBe('https://decentraland.zone/shop/item/0xabc/7')
    })
  })

  describe('when building a token url', () => {
    it('should point at the shop route for that copy', () => {
      expect(shopTokenUrl('0xabc', '42')).toBe('https://decentraland.zone/shop/token/0xabc/42')
    })

    /**
     * Token ids are 78-digit decimals — far past what a double can hold. Anything that puts one through
     * `Number` on the way (a parse, a coercion, a template that stringifies a number) still produces a
     * plausible id, pointing at a token that is not the one the owner clicked.
     */
    it('should carry a full-length token id through unchanged', () => {
      const tokenId = '115792089237316195423570985008687907838297560521119271647069101280915328335950'

      expect(shopTokenUrl('0xabc', tokenId)).toBe(`https://decentraland.zone/shop/token/0xabc/${tokenId}`)
      expect(shopTokenUrl('0xabc', tokenId)).toContain(tokenId)
    })
  })

  describe('when the configured shop url has a trailing slash', () => {
    it('should not double the separator', () => {
      mockGetEnv.mockReturnValue('https://decentraland.zone/shop/')

      expect(shopItemUrl('0xabc', '1')).toBe('https://decentraland.zone/shop/item/0xabc/1')
    })
  })

  describe('when the environment does not configure a shop url', () => {
    it('should fall back to production rather than build a relative link', () => {
      mockGetEnv.mockReturnValue(undefined)

      expect(shopItemUrl('0xabc', '1')).toBe('https://decentraland.org/shop/item/0xabc/1')
    })
  })

  /**
   * The gate the callers ask before rewriting a link at all. A profile lists names, parcels and estates
   * next to wearables, and the Shop has no page for any of them — sending those to the Shop would be a
   * dead link where a working Marketplace one used to be.
   */
  describe('when deciding whether the shop has a page for a category', () => {
    it('should accept the collectibles the shop sells', () => {
      expect(isShopCategory('wearable')).toBe(true)
      expect(isShopCategory('emote')).toBe(true)
    })

    it('should refuse land, estates and names', () => {
      expect(isShopCategory('parcel')).toBe(false)
      expect(isShopCategory('estate')).toBe(false)
      expect(isShopCategory('ens')).toBe(false)
    })

    it('should refuse a missing or unknown category rather than guess', () => {
      expect(isShopCategory(undefined)).toBe(false)
      expect(isShopCategory(null)).toBe(false)
      expect(isShopCategory('')).toBe(false)
      expect(isShopCategory('something-new')).toBe(false)
    })
  })
})
