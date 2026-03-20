import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Avatar } from '@dcl/schemas'
import { getEnv } from '../../config/env'

interface ProfileResponse {
  avatars: Avatar[]
}

async function fetchProfile(address: string): Promise<ProfileResponse | null> {
  try {
    const peerUrl = getEnv('PEER_URL') ?? 'https://peer.decentraland.zone'
    const response = await fetch(`${peerUrl}/lambdas/profiles/${address.toLowerCase()}`)
    if (!response.ok) return null
    const data = await response.json()
    return Array.isArray(data) ? data[0] : data
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
    getProfile: build.query<ProfileResponse | null, string | undefined>({
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

export { profileClient, useGetProfileQuery, type ProfileResponse }
