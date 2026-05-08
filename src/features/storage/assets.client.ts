import { getLandManagerSubgraph, getMarketplaceSubgraph, getRentalsSubgraph, subgraphClient } from '../../services/subgraphClient'
import { getLandQuery, getRentalsQuery, transformLandQueryResult, transformRentalsQueryResult } from './storage.helpers'
import type { DCLNamesResponse, Land, LandQueryResponse, Rental, RentalsQueryResponse } from './storage.types'

const assetsEndpoints = subgraphClient.injectEndpoints({
  endpoints: build => ({
    getUserLands: build.query<Land[], { address: string; tenantTokenIds?: string[]; lessorTokenIds?: string[] }>({
      query: ({ address, tenantTokenIds, lessorTokenIds }) => ({
        url: getLandManagerSubgraph(),
        method: 'POST',
        body: {
          query: getLandQuery(),
          variables: {
            address: address.toLowerCase(),
            tenantTokenIds: tenantTokenIds ?? [],
            lessorTokenIds: lessorTokenIds ?? []
          }
        }
      }),
      serializeQueryArgs: ({ queryArgs, endpointName }) => ({
        endpointName,
        address: queryArgs.address,
        tenantTokenIds: (queryArgs.tenantTokenIds ?? []).slice().sort().join(','),
        lessorTokenIds: (queryArgs.lessorTokenIds ?? []).slice().sort().join(',')
      }),
      transformResponse: (response: LandQueryResponse) => transformLandQueryResult(response.data),
      providesTags: ['UserLands' as const]
    }),

    getUserRentals: build.query<{ lessorRentals: Rental[]; tenantRentals: Rental[] }, { address: string }>({
      query: ({ address }) => ({
        url: getRentalsSubgraph(),
        method: 'POST',
        body: {
          query: getRentalsQuery(),
          variables: { address: address.toLowerCase() }
        }
      }),
      transformResponse: (response: RentalsQueryResponse) => transformRentalsQueryResult(response.data),
      providesTags: ['UserRentals' as const]
    }),

    getUserDCLNames: build.query<string[], { address: string }>({
      query: ({ address }) => ({
        url: getMarketplaceSubgraph(),
        method: 'POST',
        body: {
          query: `query Names($address: String!) {
            nfts(first: 1000, where: { owner_: { id: $address }, category: ens }) {
              ens { subdomain }
            }
          }`,
          variables: { address: address.toLowerCase() }
        }
      }),
      transformResponse: (response: DCLNamesResponse) => response.data.nfts.map(nft => `${nft.ens.subdomain}.dcl.eth`),
      providesTags: ['UserNames' as const]
    })
  })
})

const { useGetUserDCLNamesQuery, useGetUserLandsQuery, useGetUserRentalsQuery } = assetsEndpoints

export { assetsEndpoints, useGetUserDCLNamesQuery, useGetUserLandsQuery, useGetUserRentalsQuery }
