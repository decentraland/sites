import type { MarketplaceCollection, MarketplaceItem } from '../features/marketplace'
import { collectionToOption, groupThumbnailsByContract, isCollectionUrn, itemToOption, urnToOption } from './useFeaturedAssetSearch.helpers'

const CONTRACT = '0x1234567890abcdef1234567890abcdef12345678'
const ITEM_URN = `urn:decentraland:matic:collections-v2:${CONTRACT}:0`
const COLLECTION_URN = `urn:decentraland:matic:collections-v2:${CONTRACT}`

function buildItem(overrides: Partial<MarketplaceItem> = {}): MarketplaceItem {
  return {
    id: 'item-id',
    name: 'Reindeer Hat',
    thumbnail: 'https://peer.test/thumb-0.png',
    urn: ITEM_URN,
    category: 'wearable',
    contractAddress: CONTRACT,
    itemId: '0',
    creator: '0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333',
    network: 'MATIC',
    ...overrides
  }
}

function buildCollection(overrides: Partial<MarketplaceCollection> = {}): MarketplaceCollection {
  return {
    urn: COLLECTION_URN,
    name: 'Winter Drop',
    creator: '0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333',
    contractAddress: CONTRACT,
    size: 4,
    network: 'MATIC',
    isOnSale: true,
    ...overrides
  }
}

describe('isCollectionUrn', () => {
  describe('when the urn has no trailing item id', () => {
    it('should report it as a collection', () => {
      expect(isCollectionUrn(COLLECTION_URN)).toBe(true)
    })
  })

  describe('when the urn ends with an item id', () => {
    it('should report it as an item', () => {
      expect(isCollectionUrn(ITEM_URN)).toBe(false)
    })
  })
})

describe('groupThumbnailsByContract', () => {
  describe('when items span several contracts', () => {
    it('should bucket each thumbnail under its own lowercased contract', () => {
      const other = '0x9999999999999999999999999999999999999999'
      const grouped = groupThumbnailsByContract([
        buildItem({ thumbnail: 'a.png' }),
        buildItem({ thumbnail: 'b.png', contractAddress: other })
      ])

      expect(grouped.get(CONTRACT)).toEqual(['a.png'])
      expect(grouped.get(other)).toEqual(['b.png'])
    })
  })

  describe('and a contract has more items than the tile can show', () => {
    it('should keep only the first four', () => {
      const items = ['a', 'b', 'c', 'd', 'e'].map(name => buildItem({ thumbnail: `${name}.png` }))

      expect(groupThumbnailsByContract(items).get(CONTRACT)).toEqual(['a.png', 'b.png', 'c.png', 'd.png'])
    })
  })

  describe('and an item has no thumbnail', () => {
    it('should skip it', () => {
      expect(groupThumbnailsByContract([buildItem({ thumbnail: '' })]).size).toBe(0)
    })
  })
})

describe('itemToOption', () => {
  describe('when the creator has a resolved profile name', () => {
    it('should attach the name and lowercase the address', () => {
      const names = new Map([['0xaaaabbbbccccddddeeeeffff0000111122223333', 'MetaTiger']])

      expect(itemToOption(buildItem(), names)).toEqual({
        urn: ITEM_URN,
        name: 'Reindeer Hat',
        kind: 'item',
        thumbnails: ['https://peer.test/thumb-0.png'],
        creator: '0xaaaabbbbccccddddeeeeffff0000111122223333',
        creatorName: 'MetaTiger'
      })
    })
  })

  describe('and the item has no thumbnail', () => {
    it('should produce an empty thumbnail list', () => {
      expect(itemToOption(buildItem({ thumbnail: '' }), new Map()).thumbnails).toEqual([])
    })
  })
})

describe('collectionToOption', () => {
  describe('when previews were fetched for the collection', () => {
    it('should attach them as the tiled thumbnails', () => {
      const previews = new Map([[CONTRACT, ['a.png', 'b.png']]])

      expect(collectionToOption(buildCollection(), previews, new Map())).toEqual({
        urn: COLLECTION_URN,
        name: 'Winter Drop',
        kind: 'collection',
        thumbnails: ['a.png', 'b.png'],
        creator: '0xaaaabbbbccccddddeeeeffff0000111122223333',
        creatorName: undefined
      })
    })
  })

  describe('and no previews came back for it', () => {
    it('should fall back to an empty thumbnail list', () => {
      expect(collectionToOption(buildCollection(), new Map(), new Map()).thumbnails).toEqual([])
    })
  })
})

describe('urnToOption', () => {
  describe('when the urn points at an item', () => {
    it('should label the option with the raw urn and no creator', () => {
      expect(urnToOption(ITEM_URN)).toEqual({ urn: ITEM_URN, name: ITEM_URN, kind: 'item', thumbnails: [], creator: '' })
    })
  })

  describe('when the urn points at a collection', () => {
    it('should mark the option as a collection', () => {
      expect(urnToOption(COLLECTION_URN).kind).toBe('collection')
    })
  })
})
