import { useMemo } from 'react'
import { useGetProfileSnapshots } from '../features/profile/profile.client'
import type { Profile as CatalystProfile, Snapshot } from '../features/profile/profile.client'
import type { ProfileSummary } from '../features/profile/profile.types'

type UseProfilesResult = {
  profiles: Map<string, ProfileSummary>
  isLoading: boolean
  error: Error | null
}

function toProfileSummary(address: string, catalystProfile: CatalystProfile | null): ProfileSummary {
  const avatar = catalystProfile?.avatars?.[0]
  return {
    address,
    name: avatar?.name,
    hasClaimedName: avatar?.hasClaimedName ?? false,
    avatarFace256: avatar?.avatar?.snapshots?.face256
  }
}

// Batch view over the shared profile store (`features/profile/profile.client`), which
// coalesces every profile read in a tick into one POST /lambdas/profiles per peer.
// The map holds every address that has settled: with a profile, without one, or as part
// of a batch that failed. Only an address still in flight is absent, so `profiles.has()`
// is the one "stop waiting" signal every consumer reads, and the summary's empty fields
// send them to the address fallback. `error` reports a failed batch on the side.
function useProfiles(addresses: string[], peerUrl?: string): UseProfilesResult {
  const snapshots = useGetProfileSnapshots(addresses, peerUrl)

  return useMemo(() => {
    const profiles = new Map<string, ProfileSummary>()
    let isLoading = false
    let failed = false

    for (const [address, snapshot] of snapshots) {
      const settled: Snapshot = snapshot ?? { data: null, isLoading: true, hasError: false }
      if (settled.hasError) failed = true
      if (settled.isLoading) {
        isLoading = true
        continue
      }
      profiles.set(address, toProfileSummary(address, settled.data))
    }

    return { profiles, isLoading, error: failed ? new Error('Failed to fetch profiles') : null }
  }, [snapshots])
}

function useProfile(address?: string): { profile: ProfileSummary | null; isLoading: boolean; error: Error | null } {
  const addresses = useMemo(() => (address ? [address] : []), [address])
  const { profiles, isLoading, error } = useProfiles(addresses)
  return {
    profile: address ? profiles.get(address.toLowerCase()) ?? null : null,
    isLoading,
    error
  }
}

export { useProfile, useProfiles }
export type { UseProfilesResult }
