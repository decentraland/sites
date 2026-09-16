import { marketplaceClient } from '../../services/marketplaceClient'
import type {
  CollectionsByUrnQuery,
  ItemsByContractQuery,
  ItemsByUrnQuery,
  MarketplaceCollectionsResponse,
  MarketplaceItemsResponse,
  SearchMarketplaceQuery
} from './marketplace.types'

const DEFAULT_ITEM_RESULTS = 12
const DEFAULT_COLLECTION_RESULTS = 6

const marketplaceSearchApi = marketplaceClient.injectEndpoints({
  endpoints: builder => ({
    // Free-text item search. `/v1/items` only ever returns collection items (wearables + emotes),
    // which is exactly the set an event can feature, so no category filter is needed here. Callers
    // still drop rows whose URN the events backend won't accept (collections-v1) — see
    // `isValidFeaturedItemUrn` — which is why the default page size is larger than the design's
    // visible row count.
    searchMarketplaceItems: builder.query<MarketplaceItemsResponse, SearchMarketplaceQuery>({
      query: ({ search, first = DEFAULT_ITEM_RESULTS }) => {
        const params = new URLSearchParams()
        params.set('search', search)
        params.set('first', String(first))
        return `/v1/items?${params.toString()}`
      },
      providesTags: (_result, _error, { search }) => [{ type: 'Items', id: `search-${search}` }]
    }),

    searchMarketplaceCollections: builder.query<MarketplaceCollectionsResponse, SearchMarketplaceQuery>({
      query: ({ search, first = DEFAULT_COLLECTION_RESULTS }) => {
        const params = new URLSearchParams()
        params.set('search', search)
        params.set('first', String(first))
        return `/v1/collections?${params.toString()}`
      },
      providesTags: (_result, _error, { search }) => [{ type: 'Collections', id: `search-${search}` }]
    }),

    // Collection rows render a tile built from their items' thumbnails, and `/v1/collections` carries
    // none. `contractAddress` is a repeatable filter, so every visible collection is covered by ONE
    // request instead of one per row (pre-PR rule 12).
    getMarketplaceItemsByContract: builder.query<MarketplaceItemsResponse, ItemsByContractQuery>({
      query: ({ contractAddresses, first }) => {
        const params = new URLSearchParams()
        for (const address of contractAddresses) params.append('contractAddress', address.toLowerCase())
        params.set('first', String(first ?? contractAddresses.length * 4))
        return `/v1/items?${params.toString()}`
      },
      providesTags: (_result, _error, { contractAddresses }) => [
        { type: 'Items', id: `contracts-${[...contractAddresses].sort().join(',')}` }
      ]
    }),

    // Hydration for an already-saved `featured_item`: resolves a bare URN back into a name+thumbnail
    // so editing an event shows the chosen asset instead of the raw string.
    getMarketplaceItemsByUrn: builder.query<MarketplaceItemsResponse, ItemsByUrnQuery>({
      query: ({ urns }) => {
        const params = new URLSearchParams()
        for (const urn of urns) params.append('urn', urn)
        params.set('first', String(urns.length))
        return `/v1/items?${params.toString()}`
      },
      providesTags: (_result, _error, { urns }) => [{ type: 'Items', id: `urns-${[...urns].sort().join(',')}` }]
    }),

    getMarketplaceCollectionByUrn: builder.query<MarketplaceCollectionsResponse, CollectionsByUrnQuery>({
      query: ({ urn }) => {
        const params = new URLSearchParams()
        params.set('urn', urn)
        params.set('first', '1')
        return `/v1/collections?${params.toString()}`
      },
      providesTags: (_result, _error, { urn }) => [{ type: 'Collections', id: `urn-${urn}` }]
    })
  })
})

const {
  useGetMarketplaceCollectionByUrnQuery,
  useGetMarketplaceItemsByContractQuery,
  useGetMarketplaceItemsByUrnQuery,
  useSearchMarketplaceCollectionsQuery,
  useSearchMarketplaceItemsQuery
} = marketplaceSearchApi

export {
  DEFAULT_COLLECTION_RESULTS,
  DEFAULT_ITEM_RESULTS,
  marketplaceSearchApi,
  useGetMarketplaceCollectionByUrnQuery,
  useGetMarketplaceItemsByContractQuery,
  useGetMarketplaceItemsByUrnQuery,
  useSearchMarketplaceCollectionsQuery,
  useSearchMarketplaceItemsQuery
}
