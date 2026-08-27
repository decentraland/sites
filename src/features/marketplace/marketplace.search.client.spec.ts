import { configureStore } from '@reduxjs/toolkit'
import { getEnv } from '../../config/env'
import { marketplaceSearchApi } from './marketplace.search.client'

jest.mock('../../config/env')

const mockGetEnv = jest.mocked(getEnv)

const CONTRACT = '0x1234567890abcdef1234567890abcdef12345678'
const OTHER_CONTRACT = '0x9999999999999999999999999999999999999999'

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body))
  } as unknown as Response
}

function createTestStore() {
  return configureStore({
    reducer: { [marketplaceSearchApi.reducerPath]: marketplaceSearchApi.reducer },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(marketplaceSearchApi.middleware)
  })
}

describe('marketplaceSearchApi', () => {
  let fetchSpy: jest.SpyInstance

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse({ data: [], total: 0 }))
    mockGetEnv.mockImplementation(key => (key === 'MARKETPLACE_API_URL' ? 'https://marketplace-api.test' : undefined))
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.resetAllMocks()
  })

  function requestedUrl(): string {
    return String((fetchSpy.mock.calls[0][0] as Request).url ?? fetchSpy.mock.calls[0][0])
  }

  describe('when searching items', () => {
    it('should hit /v1/items with the encoded term and the default page size', async () => {
      const store = createTestStore()

      await store.dispatch(marketplaceSearchApi.endpoints.searchMarketplaceItems.initiate({ search: 'santa hat' }))

      expect(requestedUrl()).toBe('https://marketplace-api.test/v1/items?search=santa+hat&first=12')
    })

    it('should honour an explicit page size', async () => {
      const store = createTestStore()

      await store.dispatch(marketplaceSearchApi.endpoints.searchMarketplaceItems.initiate({ search: 'hat', first: 3 }))

      expect(requestedUrl()).toContain('first=3')
    })
  })

  describe('when searching collections', () => {
    it('should hit /v1/collections with the encoded term', async () => {
      const store = createTestStore()

      await store.dispatch(marketplaceSearchApi.endpoints.searchMarketplaceCollections.initiate({ search: 'winter' }))

      expect(requestedUrl()).toBe('https://marketplace-api.test/v1/collections?search=winter&first=6')
    })
  })

  describe('when fetching collection previews', () => {
    it('should send every contract on a single request', async () => {
      const store = createTestStore()

      await store.dispatch(
        marketplaceSearchApi.endpoints.getMarketplaceItemsByContract.initiate({ contractAddresses: [CONTRACT, OTHER_CONTRACT] })
      )

      const url = requestedUrl()
      expect(url).toContain(`contractAddress=${CONTRACT}`)
      expect(url).toContain(`contractAddress=${OTHER_CONTRACT}`)
      expect(url).toContain('first=8')
    })

    it('should lowercase the contracts it is given', async () => {
      const store = createTestStore()

      await store.dispatch(
        marketplaceSearchApi.endpoints.getMarketplaceItemsByContract.initiate({ contractAddresses: [CONTRACT.toUpperCase()] })
      )

      expect(requestedUrl()).toContain(`contractAddress=${CONTRACT}`)
    })
  })

  describe('when resolving a saved urn', () => {
    it('should look the item up by urn', async () => {
      const urn = `urn:decentraland:matic:collections-v2:${CONTRACT}:0`
      const store = createTestStore()

      await store.dispatch(marketplaceSearchApi.endpoints.getMarketplaceItemsByUrn.initiate({ urns: [urn] }))

      expect(requestedUrl()).toBe(`https://marketplace-api.test/v1/items?urn=${encodeURIComponent(urn)}&first=1`)
    })

    it('should look the collection up by urn', async () => {
      const urn = `urn:decentraland:matic:collections-v2:${CONTRACT}`
      const store = createTestStore()

      await store.dispatch(marketplaceSearchApi.endpoints.getMarketplaceCollectionByUrn.initiate({ urn }))

      expect(requestedUrl()).toBe(`https://marketplace-api.test/v1/collections?urn=${encodeURIComponent(urn)}&first=1`)
    })
  })

  describe('when the store is built', () => {
    it('should expose the marketplace reducer path', () => {
      expect(Object.keys(createTestStore().getState())).toContain('marketplaceClient')
    })
  })
})
