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

interface CreationsQuery {
  address: string
  limit?: number
  offset?: number
}

const profileCreationsApi = marketplaceClient.injectEndpoints({
  endpoints: builder => ({
    getProfileCreations: builder.query<CreationsResponse, CreationsQuery>({
      query: ({ address, limit = 24, offset = 0 }) =>
        `/v1/items?creator=${encodeURIComponent(address.toLowerCase())}&first=${limit}&skip=${offset}&sortBy=newest`,
      providesTags: (_result, _error, { address }) => [{ type: 'Items', id: `creator-${address.toLowerCase()}` }, 'Items']
    })
  })
})

const { useGetProfileCreationsQuery } = profileCreationsApi

export { profileCreationsApi, useGetProfileCreationsQuery }
export type { CreationItem, CreationsQuery, CreationsResponse, CreationWearableData }
