import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getEnv } from '../config/env'

const getLandManagerSubgraph = (): string => {
  const url = getEnv('LAND_MANAGER_SUBGRAPH')
  if (!url) throw new Error('LAND_MANAGER_SUBGRAPH environment variable is not set')
  return url
}

const getMarketplaceSubgraph = (): string => {
  const url = getEnv('MARKETPLACE_SUBGRAPH')
  if (!url) throw new Error('MARKETPLACE_SUBGRAPH environment variable is not set')
  return url
}

const getRentalsSubgraph = (): string => {
  const url = getEnv('RENTALS_SUBGRAPH')
  if (!url) throw new Error('RENTALS_SUBGRAPH environment variable is not set')
  return url
}

const subgraphClient = createApi({
  reducerPath: 'subgraphClient',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  tagTypes: ['UserLands', 'UserRentals', 'UserNames'],
  keepUnusedDataFor: 300,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({})
})

export { getLandManagerSubgraph, getMarketplaceSubgraph, getRentalsSubgraph, subgraphClient }
