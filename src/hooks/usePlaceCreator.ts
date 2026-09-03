import { useMemo } from 'react'
import type { DiscoverPlace } from '../features/discover'
// Deep import on purpose: the feature barrel re-exports the RTK Query client,
// whose import.meta env access Jest cannot parse, and this hook only needs the
// pure helpers.
import { isJunkContactName, placeCreatorAddress } from '../features/discover/discover.helpers'
import { getAvatarBackgroundColor, getDisplayName, getSyntheticAvatarUrl } from '../utils/avatarColor'
import { useProfileAvatar } from './useProfileAvatar'

interface PlaceCreator {
  // Who the card credits for making the place.
  creatorName: string | undefined
  // Real catalyst face256, but only when the credited name and the resolved
  // profile are the same identity; otherwise a synthetic colored disc derived
  // from the name.
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
  // `creator_address` (the deploying wallet) before `owner` (the LAND holder),
  // the same order the /events place cards already use. Resolving `owner`
  // first is what pointed the two pages at different profiles.
  const creatorAddress = placeCreatorAddress(place)
  // Via useProfileAvatar rather than the raw query so this shares the broken
  // face256 guard with /events: catalyst sometimes hands back a snapshot URL
  // the CDN 404s, and only that hook knows the URL is dead.
  const { avatar, avatarFace, name: profileName } = useProfileAvatar(creatorAddress, { skip: !creatorAddress })
  const hasClaimedName = avatar?.hasClaimedName

  // `contact_name` comes from the scene's own scene.json, so it is the author
  // saying who made this, and it wins over the profile's display name.
  const contactName = isJunkContactName(place?.contact_name) ? undefined : place?.contact_name?.trim()
  const creatorName = contactName || profileName || undefined

  // The face has to belong to whoever the line credits. When the places-api
  // named the deploying wallet the profile IS the author, so the face is theirs
  // whatever label the scene's contact field puts on them. The `owner`
  // fallback carries no such guarantee — a studio deploying from a shared
  // wallet is exactly the case that made the page credit one person for six
  // games they had not built — so there the face is only shown when the
  // by-line came from that same profile.
  const authored = Boolean(place?.creator_address?.trim())
  const creditedFace = authored || !contactName ? avatarFace : undefined
  const creatorAvatar = creditedFace || (creatorName ? getSyntheticAvatarUrl(creatorName) : undefined)

  const avatarBg = useMemo(() => {
    if (!creatorName) return undefined
    // Key the color off the credited identity only: a contact name has no
    // address, and borrowing the creator's would colour it after the wrong person.
    const ethAddress = contactName ? undefined : creatorAddress
    return getAvatarBackgroundColor(getDisplayName({ name: creatorName, hasClaimedName: hasClaimedName ?? false, ethAddress }))
  }, [creatorName, contactName, hasClaimedName, creatorAddress])

  return { creatorName, creatorAvatar, avatarBg }
}

export { usePlaceCreator }
export type { PlaceCreator }
