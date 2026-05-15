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
    // Reveal-on-data model: on a MEMBER profile every data-driven tab starts hidden and only
    // appears once its probe confirms count > 0 (Figma 167:89148 use cases). On OWN profile every
    // tab is shown regardless of count because the empty state itself teaches the user what to do
    // (Figma 322:49163 / 346:33999 — "My Assets / My Photos / My Places" are always visible).
    const hidden = isOwnProfile ? new Set<ProfileTab>() : new Set<ProfileTab>(['places', 'photos', 'creations', 'assets', 'communities'])

    if (!isOwnProfile && places.isSuccess) {
      const total = places.data?.total ?? places.data?.data?.length ?? 0
      if (total > 0) hidden.delete('places')
    }
    if (!isOwnProfile && wearables.isSuccess && emotes.isSuccess) {
      const wearableTotal = wearables.data?.total ?? wearables.data?.data?.length ?? 0
      const emoteTotal = emotes.data?.total ?? emotes.data?.data?.length ?? 0
      if (wearableTotal > 0 || emoteTotal > 0) hidden.delete('creations')
    }
    if (!isOwnProfile && !photos.isLoading && photos.error === null) {
      const total = photos.images.length > 0 ? photos.images.length : photos.total ?? 0
      if (total > 0) hidden.delete('photos')
    }
    // `assets` and `communities` are only visible for own profile (see `ProfileTabs.types`), and on
    // own profile they always stay visible regardless of count. So we skip the count probes for
    // these on member view — the visibility filter takes care of hiding them.

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
