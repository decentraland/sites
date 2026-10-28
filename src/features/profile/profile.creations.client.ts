import { marketplaceClient } from '../../services/marketplaceClient'

interface CreationWearableData {
  category?: string
  bodyShapes?: string[]
  isSmart?: boolean
}

interface CreationItem {
  id: string
  urn: string
  name: string
  thumbnail: string
  /** Relative marketplace path (e.g. `/contracts/0x.../items/N`). */
  url: string
  /** Top-level `wearable` / `emote` / `ens` — the meaningful sub-category sits under `data.<top>.category`. */
  category: 'wearable' | 'emote' | string
  contractAddress: string
  itemId: string
  rarity?: string
  network: 'MATIC' | 'ETHEREUM'
  creator: string
  price?: string
  /** Cheapest active secondary-market listing in wei (`"0"` when no listings). Use when primary `price` is `"0"`. */
  minListingPrice?: string
  isOnSale?: boolean
  data?: {
    wearable?: CreationWearableData
    emote?: CreationWearableData
  }
}

interface CreationsResponse {
  data: CreationItem[]
  total: number
}

type CreationsCategory = 'wearable' | 'emote'

interface CreationsQuery {
  address: string
  category: CreationsCategory
  limit?: number
  offset?: number
}

const profileCreationsApi = marketplaceClient.injectEndpoints({
  endpoints: builder => ({
    getProfileCreations: builder.query<CreationsResponse, CreationsQuery>({
      // `/v2/catalog` (vs `/v1/items`) populates `minListingPrice` for items
      // whose primary supply is sold out but still trade on the secondary
      // market — needed so the CatalogCard can show a price and BUY action.
      query: ({ address, category, limit = 24, offset = 0 }) =>
        `/v2/catalog?creator=${encodeURIComponent(address.toLowerCase())}&category=${category}&first=${limit}&skip=${offset}&sortBy=newest`,
      providesTags: (_result, _error, { address, category }) => [
        { type: 'Items', id: `creator-${address.toLowerCase()}-${category}` },
        'Items'
      ]
    })
  })
})

const { useGetProfileCreationsQuery } = profileCreationsApi

export { profileCreationsApi, useGetProfileCreationsQuery }
export type { CreationItem, CreationsCategory, CreationsQuery, CreationsResponse, CreationWearableData }
