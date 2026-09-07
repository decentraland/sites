import { useMemo } from 'react'
import type { DiscoverPlace } from '../features/discover'
// Deep import on purpose: the feature barrel re-exports the RTK Query client,
// whose import.meta env access Jest cannot parse, and this hook only needs the
// pure helpers.
import { isJunkContactName, placeCreatorIdentity } from '../features/discover/discover.helpers'
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
  const { address, isDeployer } = placeCreatorIdentity(place)
  // Via useProfileAvatar rather than the raw query so this shares the broken
  // face256 guard with /events: catalyst sometimes hands back a snapshot URL
  // the CDN 404s, and only that hook knows the URL is dead. Its background
  // color is keyed off the profile's own `ethAddress`, so a checksummed
  // `creator_address` and its lowercase `owner` twin can't disagree.
  const { avatarFace, name: profileName, backgroundColor } = useProfileAvatar(address, { skip: !address })

  // `contact_name` comes from the scene's own scene.json, so it is the author
  // saying who made this, and it wins over the profile's display name.
  const contactName = isJunkContactName(place?.contact_name) ? undefined : place?.contact_name?.trim()
  const creatorName = contactName || profileName || undefined

  // NOTE: this narrows the face suppression #818 added, which dropped the
  // snapshot for EVERY place declaring a contact name and so left almost every
  // card on a synthetic disc. The face still has to belong to whoever the line
  // credits, but when the places-api named the deploying wallet the profile IS
  // the author, so the face is theirs whatever label the contact field uses.
  // The `owner` fallback carries no such guarantee — a studio deploying from a
  // shared wallet is exactly the case #818 fixed — so there the face is only
  // shown when the by-line itself came from that profile.
  const creditedFace = isDeployer || !contactName ? avatarFace : undefined
  const creatorAvatar = creditedFace || (creatorName ? getSyntheticAvatarUrl(creatorName) : undefined)

  const avatarBg = useMemo(() => {
    if (!creatorName) return undefined
    // A contact name is a label with no address behind it, so it gets its own
    // deterministic color; borrowing the creator's would colour it after the
    // wrong person. When the by-line came from the profile, reuse the color
    // that profile already resolved to.
    if (!contactName) return backgroundColor
    return getAvatarBackgroundColor(getDisplayName({ name: creatorName, hasClaimedName: false, ethAddress: undefined }))
  }, [creatorName, contactName, backgroundColor])

  return { creatorName, creatorAvatar, avatarBg }
}

export { usePlaceCreator }
export type { PlaceCreator }
