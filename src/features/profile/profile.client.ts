import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { type LambdasClient, createLambdasClient } from 'dcl-catalyst-client'
import type { Profile } from 'dcl-catalyst-client/dist/client/specs/lambdas-client'
import { getEnv } from '../../config/env'

function getLambdasClient(): LambdasClient {
  const peerUrl = getEnv('PEER_URL')
  return createLambdasClient({ url: `${peerUrl}/lambdas`, fetcher: { fetch: fetch as never } })
}

async function fetchProfile(address: string): Promise<Profile | null> {
  try {
    const client = getLambdasClient()
    return await client.getAvatarDetails(address.toLowerCase())
  } catch {
    return null
  }
}

const profileClient = createApi({
  reducerPath: 'profileClient',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Profile'],
  keepUnusedDataFor: 300,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: build => ({
    getProfile: build.query<Profile | null, string | undefined>({
      queryFn: async address => {
        if (!address) return { data: null }
        try {
          const profile = await fetchProfile(address)
          return { data: profile }
        } catch {
          return { data: null }
        }
      },
      providesTags: (_result, _error, address) => (address ? [{ type: 'Profile', id: address }] : [])
    })
  })
})

const { useGetProfileQuery } = profileClient

export { profileClient, useGetProfileQuery, type Profile }
