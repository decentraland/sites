import { marketplaceClient } from '../../services/marketplaceClient'

type ItemCategory = 'wearable' | 'emote' | 'name' | 'land' | 'estate'

interface ProfileItem {
  id: string
  name: string
  thumbnail: string
  category: ItemCategory
  price?: string
  rarity?: string
  createdAt: number
}

interface ItemsResponse {
  data: ProfileItem[]
  total: number
  page: number
  pages: number
}

type ItemsQuery = {
  address: string
  limit?: number
  offset?: number
}

const profileCreationsApi = marketplaceClient.injectEndpoints({
  endpoints: builder => ({
    getProfileCreations: builder.query<ItemsResponse, ItemsQuery>({
      query: ({ address, limit = 24, offset = 0 }) =>
        `/items?creator=${encodeURIComponent(address.toLowerCase())}&first=${limit}&skip=${offset}&sortBy=newest`,
      providesTags: (_result, _error, { address }) => [{ type: 'Items', id: `creator-${address.toLowerCase()}` }, 'Items']
    })
  })
})

const { useGetProfileCreationsQuery } = profileCreationsApi

export { profileCreationsApi, useGetProfileCreationsQuery }
export type { ItemCategory, ItemsQuery, ItemsResponse, ProfileItem }
