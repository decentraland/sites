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

// MANA transfer history is read from the `mana-graph` subgraphs (Log entity), one per chain.
const getManaEthereumSubgraph = (): string => {
  const url = getEnv('MANA_ETHEREUM_SUBGRAPH')
  if (!url) throw new Error('MANA_ETHEREUM_SUBGRAPH environment variable is not set')
  return url
}

const getManaMaticSubgraph = (): string => {
  const url = getEnv('MANA_MATIC_SUBGRAPH')
  if (!url) throw new Error('MANA_MATIC_SUBGRAPH environment variable is not set')
  return url
}

const subgraphClient = createApi({
  reducerPath: 'subgraphClient',
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  tagTypes: ['UserLands', 'UserRentals', 'UserNames', 'ManaTransfers'],
  keepUnusedDataFor: 300,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({})
})

export { getLandManagerSubgraph, getManaEthereumSubgraph, getManaMaticSubgraph, getMarketplaceSubgraph, getRentalsSubgraph, subgraphClient }
