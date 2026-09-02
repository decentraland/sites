import { useMemo } from 'react'
import type { DiscoverPlace } from '../features/discover'
// Deep import on purpose: the feature barrel re-exports the RTK Query client,
// whose import.meta env access Jest cannot parse, and this hook only needs the
// pure helper.
import { isJunkContactName } from '../features/discover/discover.helpers'
import { useGetProfileQuery } from '../features/profile/profile.client'
import { getAvatarBackgroundColor, getDisplayName, getSyntheticAvatarUrl } from '../utils/avatarColor'

interface PlaceCreator {
  // Who the card credits for making the place.
  creatorName: string | undefined
  // Real catalyst face256, but only when the credited name came from that same
  // profile; otherwise a synthetic colored disc derived from the name.
  creatorAvatar: string | undefined
  // ADR-292 deterministic identity color, painted behind the (possibly
  // transparent) face256 snapshot.
  avatarBg: string | undefined
}

// The creator a discover place card credits, with their avatar and ADR-292
// background. The profile query's module-level cache dedupes per address
// across a grid, so mounting this in every card doesn't fan out per-card
// requests.
function usePlaceCreator(place: DiscoverPlace | undefined): PlaceCreator {
  const { data: ownerProfile } = useGetProfileQuery(place?.owner ?? undefined, { skip: !place?.owner })
  const hasClaimedName = ownerProfile?.avatars?.[0]?.hasClaimedName

  // `contact_name` comes from the scene's own scene.json, so it is the author
  // saying who made this. `owner` is whoever holds the LAND or the world name,
  // which stops being the author the moment a studio deploys from a shared
  // wallet — resolving that wallet to its profile is what made the page credit
  // one person for six games they had not built. The contact therefore wins,
  // and the owner profile is only read when the scene declares no contact.
  const contactName = isJunkContactName(place?.contact_name) ? undefined : place?.contact_name?.trim()
  const ownerProfileName = ownerProfile?.avatars?.[0]?.name
  const creatorName = contactName || ownerProfileName || undefined

  // The face has to belong to whoever the line credits. A real face256 is only
  // that person's when the name came from the same profile; behind a contact
  // name it would put the land owner's picture next to somebody else's name.
  const creditedFace = contactName ? undefined : ownerProfile?.avatars?.[0]?.avatar?.snapshots?.face256
  const creatorAvatar = creditedFace || (creatorName ? getSyntheticAvatarUrl(creatorName) : undefined)

  const avatarBg = useMemo(() => {
    if (!creatorName) return undefined
    // Key the color off the credited identity only: a contact name has no
    // address, and borrowing the owner's would colour it after the wrong person.
    const ethAddress = contactName ? undefined : place?.owner ?? undefined
    return getAvatarBackgroundColor(getDisplayName({ name: creatorName, hasClaimedName: hasClaimedName ?? false, ethAddress }))
  }, [creatorName, contactName, hasClaimedName, place?.owner])

  return { creatorName, creatorAvatar, avatarBg }
}

export { usePlaceCreator }
export type { PlaceCreator }
