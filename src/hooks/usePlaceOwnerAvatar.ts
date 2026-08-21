import { useMemo } from 'react'
import type { DiscoverPlace } from '../features/discover'
import { useGetProfileQuery } from '../features/profile/profile.client'
import { getAvatarBackgroundColor, getDisplayName, getSyntheticAvatarUrl } from '../utils/avatarColor'

interface PlaceOwnerAvatar {
  ownerName: string | undefined
  // Real catalyst face256 when the owner has a deployed profile, else a
  // synthetic colored disc derived from the display name.
  ownerAvatar: string | undefined
  // ADR-292 deterministic identity color, painted behind the (possibly
  // transparent) face256 snapshot.
  avatarBg: string | undefined
}

// Owner catalyst profile + avatar + ADR-292 background for a discover place.
// The profile query's module-level cache dedupes per address across a grid,
// so mounting this in every card doesn't fan out per-card requests.
function usePlaceOwnerAvatar(place: DiscoverPlace | undefined): PlaceOwnerAvatar {
  const { data: ownerProfile } = useGetProfileQuery(place?.owner ?? undefined, { skip: !place?.owner })
  const realAvatar = ownerProfile?.avatars?.[0]?.avatar?.snapshots?.face256
  const hasClaimedName = ownerProfile?.avatars?.[0]?.hasClaimedName
  // The owner's profile name wins so the by-line matches the avatar next to
  // it; scene metadata (`user_name` / `contact_name`) is only a fallback — and
  // the sdk-commands default contact ("SDK") is junk, not an identity, so it
  // is skipped entirely (the card simply renders without a by-line).
  const metadataName = [place?.user_name, place?.contact_name].find(n => n && n.trim().toLowerCase() !== 'sdk')
  const ownerName = ownerProfile?.avatars?.[0]?.name || metadataName || undefined
  const ownerAvatar = realAvatar || (ownerName ? getSyntheticAvatarUrl(ownerName) : undefined)
  const avatarBg = useMemo(
    () =>
      ownerName
        ? getAvatarBackgroundColor(
            getDisplayName({ name: ownerName, hasClaimedName: hasClaimedName ?? false, ethAddress: place?.owner ?? undefined })
          )
        : undefined,
    [ownerName, hasClaimedName, place?.owner]
  )
  return { ownerName, ownerAvatar, avatarBg }
}

export { usePlaceOwnerAvatar }
export type { PlaceOwnerAvatar }
