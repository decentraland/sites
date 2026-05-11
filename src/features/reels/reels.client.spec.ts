import { clearImageCache, enrichWearables, fetchImageById, fetchImagesByUser, isMaticUrn } from './reels.client'

jest.mock('../../config/env', () => ({
  getEnv: (key: string) => {
    const env: Record<string, string> = {
      REEL_SERVICE_URL: 'https://reels-test.local',
      THE_GRAPH_API_ETH_URL: 'https://graph-eth-test.local',
      THE_GRAPH_API_MATIC_URL: 'https://graph-matic-test.local'
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
  clearImageCache()
})

describe('reels.client', () => {
  describe('when fetching an image by id', () => {
    it('should call the camera-reel-service metadata endpoint', async () => {
      const fakeImage = { id: 'abc', url: 'u', thumbnailUrl: 't', metadata: { visiblePeople: [] } }
      fetchMock.mockResolvedValue({ ok: true, json: async () => fakeImage })
      const result = await fetchImageById('abc')
      expect(fetchMock).toHaveBeenCalledWith('https://reels-test.local/api/images/abc/metadata', expect.any(Object))
      expect(result.id).toBe('abc')
    })

    it('should hit the cache on subsequent calls with the same id', async () => {
      const fakeImage = { id: 'cached-id', url: 'u', thumbnailUrl: 't', metadata: { visiblePeople: [] } }
      fetchMock.mockResolvedValue({ ok: true, json: async () => fakeImage })
      await fetchImageById('cached-id')
      await fetchImageById('cached-id')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('should throw when the response is not ok', async () => {
      fetchMock.mockResolvedValue({ ok: false })
      await expect(fetchImageById('missing')).rejects.toThrow('Image missing not found')
    })
  })

  describe('when fetching images by user', () => {
    it('should encode limit and offset query params', async () => {
      fetchMock.mockResolvedValue({
        ok: true,

        json: async () => ({ images: [], currentImages: 0, maxImages: 0 })
      })
      await fetchImagesByUser('0xabc', { limit: 24, offset: 0 })
      expect(fetchMock).toHaveBeenCalledWith('https://reels-test.local/api/users/0xabc/images?limit=24&offset=0', expect.any(Object))
    })

    it('should throw when the response is not ok', async () => {
      fetchMock.mockResolvedValue({ ok: false })
      await expect(fetchImagesByUser('0xabc', { limit: 24, offset: 0 })).rejects.toThrow()
    })
  })

  describe('when classifying a URN as matic vs ethereum', () => {
    it.each([
      ['urn:decentraland:matic:collections-v2:0xabc:1', true],
      ['urn:decentraland:amoy:collections-v2:0xabc:1', true],
      ['urn:decentraland:ethereum:collections-v1:rtfkt_x_atari:rtfkt_x_atari_yellow', false],
      ['urn:decentraland:sepolia:collections-v1:something:item', false]
    ])('classifies "%s" correctly', (urn, expected) => {
      expect(isMaticUrn(urn)).toBe(expected)
    })
  })

  describe('when enriching wearables for users', () => {
    const ethGraphItem = {
      id: 'eth-item-1',
      blockchainId: '7',
      image: 'https://eth.image/1',
      urn: 'urn:decentraland:ethereum:collections-v1:eth:item',
      collection: { id: '0xeth' },
      metadata: { wearable: { name: 'Eth Hat', rarity: 'epic' } }
    }
    const maticGraphItem = {
      id: 'matic-item-1',
      blockchainId: '42',
      image: 'https://matic.image/1',
      urn: 'urn:decentraland:matic:collections-v2:0xmatic:0',
      collection: { id: '0xmatic' },
      metadata: { wearable: { name: 'Matic Shirt', rarity: 'rare' } }
    }

    it('should split URNs by network and merge graph results', async () => {
      fetchMock
        // eth call
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { items: [ethGraphItem] } }) })
        // matic call
        .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { items: [maticGraphItem] } }) })

      const users = [
        {
          userName: 'alice',
          userAddress: '0xa',
          isGuest: false,
          wearables: [ethGraphItem.urn, maticGraphItem.urn]
        }
      ]
      const enriched = await enrichWearables(users)

      expect(enriched[0].wearablesParsed).toHaveLength(2)
      expect(enriched[0].wearablesParsed?.[0]).toMatchObject({
        name: 'Eth Hat',
        rarity: 'epic',
        collectionId: '0xeth',
        blockchainId: '7'
      })
      expect(enriched[0].wearablesParsed?.[1]).toMatchObject({
        name: 'Matic Shirt',
        rarity: 'rare',
        collectionId: '0xmatic',
        blockchainId: '42'
      })
    })

    it('should return users untouched when there are no wearables', async () => {
      const users = [{ userName: 'b', userAddress: '0xb', isGuest: true, wearables: [] }]
      const enriched = await enrichWearables(users)
      expect(enriched).toEqual(users)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('should default rarity to "common" when graph metadata is missing', async () => {
      const itemWithoutMeta = { ...ethGraphItem, metadata: {} }
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { items: [itemWithoutMeta] } }) })
      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ data: { items: [] } }) })

      const enriched = await enrichWearables([{ userName: 'c', userAddress: '0xc', isGuest: false, wearables: [ethGraphItem.urn] }])
      expect(enriched[0].wearablesParsed?.[0].rarity).toBe('common')
    })
  })
})
