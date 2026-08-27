const mockSearchItems = jest.fn()
const mockSearchCollections = jest.fn()
const mockItemsByContract = jest.fn()
const mockItemsByUrn = jest.fn()
const mockCollectionByUrn = jest.fn()
const mockProfileNames = jest.fn()

jest.mock('../features/marketplace', () => ({
  useSearchMarketplaceItemsQuery: (...args: unknown[]) => mockSearchItems(...args),
  useSearchMarketplaceCollectionsQuery: (...args: unknown[]) => mockSearchCollections(...args),
  useGetMarketplaceItemsByContractQuery: (...args: unknown[]) => mockItemsByContract(...args),
  useGetMarketplaceItemsByUrnQuery: (...args: unknown[]) => mockItemsByUrn(...args),
  useGetMarketplaceCollectionByUrnQuery: (...args: unknown[]) => mockCollectionByUrn(...args)
}))

jest.mock('../features/profile/profile.client', () => ({
  useGetProfileNames: (...args: unknown[]) => mockProfileNames(...args)
}))

import { act, renderHook } from '@testing-library/react'
import { SEARCH_DEBOUNCE_MS, useFeaturedAssetSearch } from './useFeaturedAssetSearch'

const CONTRACT = '0x1234567890abcdef1234567890abcdef12345678'
const ITEM_URN = `urn:decentraland:matic:collections-v2:${CONTRACT}:0`
const COLLECTION_URN = `urn:decentraland:matic:collections-v2:${CONTRACT}`
const LEGACY_URN = 'urn:decentraland:ethereum:collections-v1:xmas_2019:xmas_reindeer_hat'

const idle = { data: undefined, isFetching: false }

function buildItem(overrides = {}) {
  return {
    id: 'id',
    name: 'Reindeer Hat',
    thumbnail: 'thumb.png',
    urn: ITEM_URN,
    category: 'wearable',
    contractAddress: CONTRACT,
    itemId: '0',
    creator: '0xAAAA',
    network: 'MATIC',
    ...overrides
  }
}

function buildCollection(overrides = {}) {
  return {
    urn: COLLECTION_URN,
    name: 'Winter Drop',
    creator: '0xBBBB',
    contractAddress: CONTRACT,
    size: 4,
    network: 'MATIC',
    isOnSale: true,
    ...overrides
  }
}

/** Renders the hook past the input debounce so the queries see the final term. */
function renderSettled(query: string) {
  const rendered = renderHook(({ value }: { value: string }) => useFeaturedAssetSearch(value), { initialProps: { value: query } })
  act(() => {
    jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS)
  })
  return rendered
}

describe('useFeaturedAssetSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockSearchItems.mockReturnValue(idle)
    mockSearchCollections.mockReturnValue(idle)
    mockItemsByContract.mockReturnValue(idle)
    mockItemsByUrn.mockReturnValue(idle)
    mockCollectionByUrn.mockReturnValue(idle)
    mockProfileNames.mockReturnValue(new Map())
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  describe('when the query is shorter than the minimum', () => {
    it('should skip every request and return no options', () => {
      const { result } = renderSettled('h')

      expect(mockSearchItems).toHaveBeenLastCalledWith({ search: 'h' }, { skip: true })
      expect(mockSearchCollections).toHaveBeenLastCalledWith({ search: 'h' }, { skip: true })
      expect(result.current.options).toEqual([])
      expect(result.current.isEmpty).toBe(false)
    })
  })

  describe('when the query is a free-text search', () => {
    it('should query items and collections and return items before collections', () => {
      mockSearchItems.mockReturnValue({ data: { data: [buildItem()], total: 1 }, isFetching: false })
      mockSearchCollections.mockReturnValue({ data: { data: [buildCollection()], total: 1 }, isFetching: false })
      mockProfileNames.mockReturnValue(new Map([['0xaaaa', 'MetaTiger']]))

      const { result } = renderSettled('hat')

      expect(mockSearchItems).toHaveBeenLastCalledWith({ search: 'hat' }, { skip: false })
      expect(result.current.options.map(option => option.kind)).toEqual(['item', 'collection'])
      expect(result.current.options[0].creatorName).toBe('MetaTiger')
    })

    it('should drop results whose urn the events backend rejects', () => {
      mockSearchItems.mockReturnValue({ data: { data: [buildItem({ urn: LEGACY_URN })], total: 1 }, isFetching: false })

      expect(renderSettled('hat').result.current.options).toEqual([])
    })

    it('should batch the collection thumbnail lookup into one request', () => {
      mockSearchCollections.mockReturnValue({ data: { data: [buildCollection()], total: 1 }, isFetching: false })
      mockItemsByContract.mockReturnValue({ data: { data: [buildItem({ thumbnail: 'a.png' })], total: 1 }, isFetching: false })

      const { result } = renderSettled('hat')

      expect(mockItemsByContract).toHaveBeenLastCalledWith({ contractAddresses: [CONTRACT], first: 8 }, { skip: false })
      expect(result.current.options[0].thumbnails).toEqual(['a.png'])
    })

    it('should report an empty result once the search settles with nothing', () => {
      const { result } = renderSettled('zzzz')

      expect(result.current.isEmpty).toBe(true)
    })

    it('should stay loading while the searches are in flight', () => {
      mockSearchItems.mockReturnValue({ data: undefined, isFetching: true })

      const { result } = renderSettled('hat')

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isEmpty).toBe(false)
    })
  })

  describe('when the query is a pasted item urn', () => {
    it('should resolve it against the item endpoint only', () => {
      mockItemsByUrn.mockReturnValue({ data: { data: [buildItem()], total: 1 }, isFetching: false })

      const { result } = renderSettled(ITEM_URN)

      expect(mockItemsByUrn).toHaveBeenLastCalledWith({ urns: [ITEM_URN] }, { skip: false })
      expect(mockCollectionByUrn).toHaveBeenLastCalledWith({ urn: ITEM_URN }, { skip: true })
      expect(mockSearchItems).toHaveBeenLastCalledWith({ search: ITEM_URN }, { skip: true })
      expect(result.current.options).toHaveLength(1)
      expect(result.current.options[0].name).toBe('Reindeer Hat')
    })
  })

  describe('when the query is a pasted collection urn', () => {
    it('should resolve it against the collection endpoint only', () => {
      mockCollectionByUrn.mockReturnValue({ data: { data: [buildCollection()], total: 1 }, isFetching: false })

      const { result } = renderSettled(COLLECTION_URN)

      expect(mockCollectionByUrn).toHaveBeenLastCalledWith({ urn: COLLECTION_URN }, { skip: false })
      expect(mockItemsByUrn).toHaveBeenLastCalledWith({ urns: [COLLECTION_URN] }, { skip: true })
      expect(result.current.options[0].kind).toBe('collection')
    })
  })

  describe('and the marketplace cannot resolve the pasted urn', () => {
    it('should still offer the raw urn so it stays selectable', () => {
      const { result } = renderSettled(ITEM_URN)

      expect(result.current.options).toEqual([{ urn: ITEM_URN, name: ITEM_URN, kind: 'item', thumbnails: [], creator: '' }])
    })

    it('should not offer it while resolution is still in flight', () => {
      mockItemsByUrn.mockReturnValue({ data: undefined, isFetching: true })

      expect(renderSettled(ITEM_URN).result.current.options).toEqual([])
    })
  })

  describe('when the query is still being typed', () => {
    it('should not re-query until the debounce elapses', () => {
      const { rerender } = renderSettled('hat')
      mockSearchItems.mockClear()

      rerender({ value: 'hats' })

      expect(mockSearchItems).toHaveBeenLastCalledWith({ search: 'hat' }, { skip: false })
    })
  })
})
