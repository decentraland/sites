import {
  buildJumpInUrl,
  buildMarketplaceWearableUrl,
  buildPlaceUrl,
  buildProfileUrl,
  buildTwitterShareUrl,
  formatPhotoDate
} from './reels.helpers'

jest.mock('../../config/env', () => ({
  getEnv: (key: string) => {
    const env: Record<string, string> = {
      JUMP_IN_URL: 'https://decentraland.org/jump',
      PROFILE_URL: 'https://profile.decentraland.org',
      MARKETPLACE_URL: 'https://market.decentraland.org',
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

  describe('when building marketplace wearable URL', () => {
    it('should target /contracts/{collectionId}/items/{blockchainId}', () => {
      expect(buildMarketplaceWearableUrl('0xcoll', '42')).toBe('https://market.decentraland.org/contracts/0xcoll/items/42')
    })
  })

  describe('when building Twitter share URL', () => {
    it('should encode text + url + hashtags', () => {
      const url = buildTwitterShareUrl('Hello world', 'https://reels.example/abc')
      expect(url).toContain('hashtags=DCLCamera')
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
