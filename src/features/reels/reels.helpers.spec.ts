import {
  buildJumpInUrl,
  buildPlaceUrl,
  buildProfileUrl,
  buildReelUrl,
  buildTwitterShareUrl,
  buildWearableDetailUrl,
  formatPhotoDate
} from './reels.helpers'

jest.mock('../../config/env', () => ({
  getEnv: (key: string) => {
    const env: Record<string, string> = {
      JUMP_IN_URL: 'https://decentraland.org/jump',
      PROFILE_URL: 'https://profile.decentraland.org',
      MARKETPLACE_URL: 'https://market.decentraland.org',
      SHOP_URL: 'https://decentraland.zone/shop',
      PLACES_API_URL: 'https://places.decentraland.org/api'
    }
    return env[key]
  }
}))

const fetchMock = jest.fn()

beforeAll(() => {
  global.fetch = fetchMock as unknown as typeof fetch
})

beforeEach(() => {
  fetchMock.mockReset()
})

describe('reels.helpers', () => {
  describe('when building jump-in URL', () => {
    it('should include the position param', () => {
      expect(buildJumpInUrl(10, 20)).toBe('https://decentraland.org/jump?position=10%2C20')
    })

    it('should include realm when provided', () => {
      expect(buildJumpInUrl(10, 20, 'main')).toBe('https://decentraland.org/jump?position=10%2C20&realm=main')
    })

    it('should accept string coordinates', () => {
      expect(buildJumpInUrl('-5', '7')).toBe('https://decentraland.org/jump?position=-5%2C7')
    })
  })

  describe('when building profile URL', () => {
    it('should append /accounts/{address}', () => {
      expect(buildProfileUrl('0xabc')).toBe('https://profile.decentraland.org/accounts/0xabc')
    })
  })

  describe('when building the wearable URL for a reel', () => {
    // The Shop, not the Marketplace: a reel's buy link is commerce, and commerce moved.
    it('should target the shop item route', () => {
      expect(buildWearableDetailUrl('0xcoll', '42')).toBe('https://decentraland.zone/shop/item/0xcoll/42')
    })
  })

  describe('when building a reel URL', () => {
    const originalLocation = window.location

    beforeAll(() => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, origin: 'https://decentraland.org' }
      })
    })

    afterAll(() => {
      Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
    })

    it('should target {origin}/reels/{imageId} regardless of the current page', () => {
      expect(buildReelUrl('img-1')).toBe('https://decentraland.org/reels/img-1')
    })
  })

  describe('when building Twitter share URL', () => {
    it('should encode text + url without hashtags', () => {
      const url = buildTwitterShareUrl('Hello world', 'https://reels.example/abc')
      expect(url).not.toContain('hashtags=')
      expect(url).toContain('text=Hello+world')
      expect(url).toContain('url=https%3A%2F%2Freels.example%2Fabc')
    })
  })

  describe('when formatting a photo date', () => {
    it('should format ISO date as "Month DD YYYY"', () => {
      const result = formatPhotoDate('2026-05-01T12:00:00Z')
      expect(result).toMatch(/May .*2026/)
    })

    it('should return empty string for invalid date', () => {
      expect(formatPhotoDate('not-a-date')).toBe('')
    })
  })

  describe('when building a place URL', () => {
    it('should resolve the absolute place URL when the place exists', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ total: 1, data: [{ id: 'p1' }] })
      })
      const url = await buildPlaceUrl(10, 20)
      expect(url).toBe('https://places.decentraland.org/place/?position=10,20')
    })

    it('should return null when the place is unknown', async () => {
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ total: 0, data: [] }) })
      expect(await buildPlaceUrl(10, 20)).toBeNull()
    })

    it('should return null when the request fails', async () => {
      fetchMock.mockRejectedValue(new Error('network'))
      expect(await buildPlaceUrl(10, 20)).toBeNull()
    })
  })
})
