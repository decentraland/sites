import type { Avatar } from '@dcl/schemas/dist/platform/profile'
import { getEnv } from '../../../config/env'

interface Profile {
  address: string
  name?: string
  hasClaimedName: boolean
  avatarFace256?: string
}

const profileCache: Map<string, Promise<Profile>> = new Map()

const createEmptyProfile = (address: string): Profile => ({
  address: address.toLowerCase(),
  hasClaimedName: false
})

const fetchProfilesFromApi = async (peerUrl: string, addresses: string[]): Promise<Profile[]> => {
  try {
    const response = await fetch(`${peerUrl}/lambdas/profiles`, {
      method: 'POST',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: addresses })
    })
    if (!response.ok) {
      console.error('[cast2/peer] Failed to fetch profiles:', response.status)
      return addresses.map(createEmptyProfile)
    }
    const body: { avatars: Avatar[] }[] = await response.json()
    return body[0].avatars.map(avatar => ({
      address: avatar.userId.toLowerCase(),
      name: avatar.name,
      hasClaimedName: avatar.hasClaimedName,
      avatarFace256: avatar.avatar?.snapshots?.face256
    }))
  } catch (error) {
    console.error('[cast2/peer] Error fetching profiles:', error)
    return addresses.map(createEmptyProfile)
  }
}

const fetchProfiles = async (addresses: string[], useCache = true): Promise<Profile[]> => {
  const peerUrl = getEnv('PEER_URL')
  if (!peerUrl) throw new Error('PEER_URL environment variable is not set')

  const lowercased = addresses.map(a => a.toLowerCase())
  const uncached: string[] = []
  const cached: Map<string, Promise<Profile>> = new Map()

  for (const address of lowercased) {
    if (useCache && profileCache.has(address)) {
      cached.set(address, profileCache.get(address)!)
    } else {
      uncached.push(address)
    }
  }

  let fresh: Profile[] = []
  if (uncached.length > 0) {
    fresh = await fetchProfilesFromApi(peerUrl, uncached)
    fresh.forEach(profile => {
      profileCache.set(profile.address, Promise.resolve(profile))
    })
  }

  const result: Profile[] = []
  for (const address of lowercased) {
    if (cached.has(address)) {
      result.push(await cached.get(address)!)
    } else {
      const fetched = fresh.find(p => p.address === address)
      if (fetched) result.push(fetched)
    }
  }
  return result
}

const fetchProfile = async (address: string, useCache = true): Promise<Profile> => {
  const profiles = await fetchProfiles([address], useCache)
  return profiles[0] ?? createEmptyProfile(address)
}

const clearProfileCache = (addresses?: string[]): void => {
  if (addresses) {
    addresses.forEach(a => profileCache.delete(a.toLowerCase()))
  } else {
    profileCache.clear()
  }
}

export { clearProfileCache, fetchProfile, fetchProfiles }
export type { Profile }
