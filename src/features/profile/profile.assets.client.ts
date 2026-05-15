import { marketplaceClient } from '../../services/marketplaceClient'

type AssetCategory = 'wearable' | 'emote' | 'ens' | 'parcel' | 'estate'

interface AssetWearableData {
  category?: string
  bodyShapes?: string[]
  rarity?: string
  isSmart?: boolean
}

interface AssetNft {
  id: string
  tokenId: string
  contractAddress: string
  name: string
  image: string
  /** Relative marketplace path (e.g. `/contracts/0x.../tokens/<tokenId>`). */
  url: string
  category: AssetCategory
  network: 'ETHEREUM' | 'MATIC'
  urn?: string
  owner: string
  data?: {
    wearable?: AssetWearableData
    emote?: AssetWearableData
  }
}

interface AssetOrder {
  id: string
  price: string
  status: string
  contractAddress: string
  tokenId: string
}

interface AssetEntry {
  nft: AssetNft
  order: AssetOrder | null
  rental: unknown | null
}

interface AssetsResponse {
  data: AssetEntry[]
  total: number
}

interface AssetsQuery {
  address: string
  category?: AssetCategory
  onSale?: boolean
  limit?: number
  offset?: number
}

const profileAssetsApi = marketplaceClient.injectEndpoints({
  endpoints: builder => ({
    getProfileAssets: builder.query<AssetsResponse, AssetsQuery>({
      query: ({ address, category, onSale, limit = 24, offset = 0 }) => {
        const params = new URLSearchParams()
        params.set('owner', address.toLowerCase())
        params.set('first', String(limit))
        params.set('skip', String(offset))
        params.set('sortBy', 'newest')
        if (category) params.set('category', category)
        if (typeof onSale === 'boolean') params.set('isOnSale', String(onSale))
        return `/v1/nfts?${params.toString()}`
      },
      providesTags: (_result, _error, { address, category }) => [
        { type: 'Nfts', id: `owner-${address.toLowerCase()}-${category ?? 'all'}` },
        'Nfts'
      ]
    })
  })
})

const { useGetProfileAssetsQuery } = profileAssetsApi

export { profileAssetsApi, useGetProfileAssetsQuery }
export type { AssetCategory, AssetEntry, AssetNft, AssetOrder, AssetWearableData, AssetsQuery, AssetsResponse }
