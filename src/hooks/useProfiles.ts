import { useEffect, useState } from 'react'
import { fetchProfiles } from '../features/cast2/peer'
import type { Profile } from '../features/cast2/peer'

interface UseProfilesResult {
  profiles: Map<string, Profile>
  isLoading: boolean
  error: Error | null
}

const useProfiles = (addresses: string[]): UseProfilesResult => {
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Re-fetch when the comma-joined address list changes — keeps the dep stable
  // for the array identity since callers usually pass a freshly built array.
  const key = addresses.join(',')

  useEffect(() => {
    if (addresses.length === 0) {
      setProfiles(new Map())
      return
    }
    let cancelled = false
    setIsLoading(true)
    setError(null)
    fetchProfiles(addresses, true)
      .then(fetched => {
        if (cancelled) return
        const map = new Map<string, Profile>()
        fetched.forEach(profile => map.set(profile.address, profile))
        setProfiles(map)
      })
      .catch(err => {
        if (cancelled) return
        console.error('[useProfiles] Error fetching profiles:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
    // `key` captures the address list contents — depending on `addresses`
    // would re-fire on every freshly-built array reference with identical
    // contents.
  }, [key])

  return { profiles, isLoading, error }
}

const useProfile = (
  address?: string
): {
  profile: Profile | null
  isLoading: boolean
  error: Error | null
} => {
  const addresses = address ? [address] : []
  const { profiles, isLoading, error } = useProfiles(addresses)
  return {
    profile: address ? profiles.get(address.toLowerCase()) || null : null,
    isLoading,
    error
  }
}

export type { UseProfilesResult }
export { useProfile, useProfiles }
