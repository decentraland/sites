import type { Avatar } from '@dcl/schemas/dist/platform/profile'
import { getEnv } from '../../config/env'

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
    // The catalyst returns ONE wrapper per requested address — an array of
    // `{ avatars: [Avatar] }`. We previously read only `body[0].avatars` and
    // dropped the rest, so any batch request larger than one address lost
    // every profile except the first. Flatten across all entries.
    const body: { avatars: Avatar[] }[] = await response.json()
    // Both id fields are deployer-controlled — keep only the addresses we asked for.
    const requested = new Set(addresses.map(address => address.toLowerCase()))
    return (body ?? [])
      .flatMap(entry => entry?.avatars ?? [])
      .map(avatar => ({
        address: (avatar.userId ?? avatar.ethAddress ?? '').toLowerCase(),
        name: avatar.name,
        hasClaimedName: avatar.hasClaimedName,
        avatarFace256: avatar.avatar?.snapshots?.face256
      }))
      .filter(profile => requested.has(profile.address))
  } catch (error) {
    console.error('[cast2/peer] Error fetching profiles:', error)
    return addresses.map(createEmptyProfile)
  }
}

const fetchProfiles = async (addresses: string[], useCache = true, peerUrlOverride?: string): Promise<Profile[]> => {
  const peerUrl = peerUrlOverride ?? getEnv('PEER_URL')
  if (!peerUrl) throw new Error('PEER_URL environment variable is not set')

  const lowercased = addresses.map(a => a.toLowerCase())
  const uncached: string[] = []

  for (const address of lowercased) {
    if (!useCache || !profileCache.has(address)) uncached.push(address)
  }

  // De-duplicate concurrent callers: when multiple hooks request the same
  // address list at the same moment, we want a SINGLE HTTP round-trip. We
  // cache the in-flight Promise (not just the resolved Profile) up front so
  // sibling callers that arrive before the response see a cache hit and
  // wait on the same promise instead of firing their own request.
  if (uncached.length > 0) {
    const inflight = fetchProfilesFromApi(peerUrl, uncached)
    for (const address of uncached) {
      profileCache.set(
        address,
        inflight.then(list => list.find(p => p.address === address) ?? createEmptyProfile(address))
      )
    }
  }

  const result: Profile[] = []
  for (const address of lowercased) {
    const entry = profileCache.get(address)
    if (entry) result.push(await entry)
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
