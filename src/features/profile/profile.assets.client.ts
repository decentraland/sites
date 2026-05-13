import { marketplaceClient } from '../../services/marketplaceClient'
import type { ItemCategory } from './profile.creations.client'

interface ProfileNft {
  id: string
  tokenId: string
  contractAddress: string
  name: string
  image: string
  category: ItemCategory
  network?: 'ETHEREUM' | 'MATIC'
}

interface NftsResponse {
  data: ProfileNft[]
  total: number
}

type NftsQuery = {
  address: string
  limit?: number
  offset?: number
  category?: ItemCategory
  onSale?: boolean
}

const profileAssetsApi = marketplaceClient.injectEndpoints({
  endpoints: builder => ({
    getProfileAssets: builder.query<NftsResponse, NftsQuery>({
      query: ({ address, limit = 24, offset = 0, category, onSale }) => {
        const params = new URLSearchParams()
        params.set('owner', address.toLowerCase())
        params.set('first', String(limit))
        params.set('skip', String(offset))
        if (category) params.set('category', category)
        if (typeof onSale === 'boolean') params.set('isOnSale', String(onSale))
        return `/nfts?${params.toString()}`
      },
      providesTags: (_result, _error, { address }) => [{ type: 'Nfts', id: `owner-${address.toLowerCase()}` }, 'Nfts']
    })
  })
})

const { useGetProfileAssetsQuery } = profileAssetsApi

export { profileAssetsApi, useGetProfileAssetsQuery }
export type { NftsQuery, NftsResponse, ProfileNft }
