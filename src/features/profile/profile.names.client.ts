import { getMarketplaceSubgraph, subgraphClient } from '../../services/subgraphClient'
import { isProfileAddress } from '../../utils/profileIdentifier'
import type { ProfileNameResponse } from './profile.types'

const PROFILE_NAME_QUERY = `query ProfileNameOwner($name: String!) {
  nfts(first: 1000, where: { category: ens, name_starts_with_nocase: $name, name_ends_with_nocase: $name }) {
    name
    owner { address }
  }
}`

const profileNamesApi = subgraphClient.injectEndpoints({
  endpoints: build => ({
    getProfileAddressByName: build.query<string | null, string>({
      async queryFn(name, _api, _options, baseQuery) {
        const result = await baseQuery({
          url: getMarketplaceSubgraph(),
          method: 'POST',
          body: { query: PROFILE_NAME_QUERY, variables: { name } },
          timeout: 5000
        })
        if (result.error) return { error: result.error }
        const response = result.data as ProfileNameResponse | null
        if (response?.errors || !Array.isArray(response?.data?.nfts)) {
          return { error: { status: 'CUSTOM_ERROR', error: 'Profile name lookup failed' } }
        }
        const match = response.data.nfts.find(nft => typeof nft?.name === 'string' && nft.name.toLowerCase() === name.toLowerCase())
        if (!match) return { data: null }
        const owner = match.owner?.address
        if (!isProfileAddress(owner)) {
          return { error: { status: 'CUSTOM_ERROR', error: 'Profile name lookup failed' } }
        }
        return { data: owner.toLowerCase() }
      }
    })
  })
})

const { useGetProfileAddressByNameQuery } = profileNamesApi

export { profileNamesApi, useGetProfileAddressByNameQuery }
