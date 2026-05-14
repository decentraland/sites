import { useMemo } from 'react'
import { useGetProfileAssetsQuery } from '../../../features/profile/profile.assets.client'
import { useGetProfileCreationsQuery } from '../../../features/profile/profile.creations.client'
import { useGetProfilePlacesQuery } from '../../../features/profile/profile.places.client'
import { useGetProfileCommunitiesQuery } from '../../../features/profile/profile.social.client'
import { useAuthIdentity } from '../../../hooks/useAuthIdentity'
import { useReelImagesByUser } from '../../../hooks/useReelImagesByUser'
import type { ProfileTab } from './ProfileTabs.types'

interface TabAvailability {
  /** Tabs that should be hidden from the nav AND treated as redirects on direct URL access. */
  hidden: Set<ProfileTab>
  /** All probe requests have resolved (success or failure). */
  isReady: boolean
}

const PROBE_OPTIONS = { limit: 1, offset: 0 } as const

function useProfileTabAvailability(address: string, isOwnProfile: boolean): TabAvailability {
  const { identity } = useAuthIdentity()

  const places = useGetProfilePlacesQuery({ address, limit: 1, offset: 0 })
  const wearables = useGetProfileCreationsQuery({ address, category: 'wearable', limit: 1, offset: 0 }, { skip: isOwnProfile })
  const emotes = useGetProfileCreationsQuery({ address, category: 'emote', limit: 1, offset: 0 }, { skip: isOwnProfile })
  const assets = useGetProfileAssetsQuery({ address, limit: 1, offset: 0 }, { skip: !isOwnProfile })
  const communities = useGetProfileCommunitiesQuery({ address, limit: 1, offset: 0 }, { skip: !isOwnProfile })
  const photos = useReelImagesByUser(address, PROBE_OPTIONS, isOwnProfile ? identity : undefined)

  return useMemo(() => {
    // Reveal-on-data model: every data-driven tab starts hidden and only appears once its probe
    // confirms count > 0. Overview is always visible; referral-rewards (own-profile only) is
    // intrinsically useful at zero invites so we keep it visible by default too.
    const hidden = new Set<ProfileTab>(['places', 'photos', 'creations', 'assets', 'communities'])
    if (places.isSuccess) {
      const total = places.data?.total ?? places.data?.data?.length ?? 0
      if (total > 0) hidden.delete('places')
    }
    if (!isOwnProfile && wearables.isSuccess && emotes.isSuccess) {
      const wearableTotal = wearables.data?.total ?? wearables.data?.data?.length ?? 0
      const emoteTotal = emotes.data?.total ?? emotes.data?.data?.length ?? 0
      if (wearableTotal > 0 || emoteTotal > 0) hidden.delete('creations')
    }
    if (isOwnProfile && assets.isSuccess) {
      const total = assets.data?.total ?? assets.data?.data?.length ?? 0
      if (total > 0) hidden.delete('assets')
    }
    if (isOwnProfile && communities.isSuccess) {
      // `/v1/members/:addr/communities` is signed-fetch + same-user-only; member visitors stay hidden.
      const total = communities.data?.data?.total ?? communities.data?.data?.results?.length ?? 0
      if (total > 0) hidden.delete('communities')
    }
    if (!photos.isLoading && photos.error === null) {
      const total = photos.images.length > 0 ? photos.images.length : photos.total ?? 0
      if (total > 0) hidden.delete('photos')
    }

    const probesReady =
      !places.isLoading &&
      (isOwnProfile || (!wearables.isLoading && !emotes.isLoading)) &&
      (!isOwnProfile || !assets.isLoading) &&
      (!isOwnProfile || !communities.isLoading) &&
      !photos.isLoading

    return { hidden, isReady: probesReady }
  }, [
    isOwnProfile,
    places.isSuccess,
    places.isLoading,
    places.data,
    wearables.isSuccess,
    wearables.isLoading,
    wearables.data,
    emotes.isSuccess,
    emotes.isLoading,
    emotes.data,
    assets.isSuccess,
    assets.isLoading,
    assets.data,
    communities.isSuccess,
    communities.isLoading,
    communities.data,
    photos.images.length,
    photos.total,
    photos.isLoading,
    photos.error
  ])
}

export { useProfileTabAvailability }
export type { TabAvailability }
