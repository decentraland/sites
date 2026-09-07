import { useMemo } from 'react'
import type { DiscoverPlace } from '../features/discover'
// Deep import on purpose: the feature barrel re-exports the RTK Query client,
// whose import.meta env access Jest cannot parse, and this hook only needs the
// pure helpers.
import { isJunkContactName, placeCreatorAddress } from '../features/discover/discover.helpers'
import { DCL_FOUNDATION_LOGO_URL, DCL_FOUNDATION_NAME, isDclFoundationCreator } from '../features/events/events.helpers'
import { DCL_FOUNDATION_BACKGROUND_COLOR, getAvatarBackgroundColor, getDisplayName, getSyntheticAvatarUrl } from '../utils/avatarColor'
import { useProfileAvatar } from './useProfileAvatar'

interface PlaceCreator {
  // Who the card credits for making the place.
  creatorName: string | undefined
  // The credited profile's real catalyst face256, the Foundation logo, or — when
  // the scene resolves to no profile at all — a synthetic colored disc derived
  // from the name.
  creatorAvatar: string | undefined
  // ADR-292 deterministic identity color, painted behind the (possibly
  // transparent) face256 snapshot.
  avatarBg: string | undefined
  // The address the by-line opens a profile for. Undefined when the scene names
  // no wallet, and for the Foundation, which has no profile to open.
  creatorAddress: string | undefined
}

// The creator a discover place card credits, with their avatar and ADR-292
// background. The profile query's module-level cache dedupes per address
// across a grid, so mounting this in every card doesn't fan out per-card
// requests.
function usePlaceCreator(place: DiscoverPlace | undefined): PlaceCreator {
  // `creator_address` (the deploying wallet) before `owner` (the LAND holder),
  // the same order the /events place cards already use. Resolving `owner`
  // first is what pointed the two pages at different profiles.
  const address = placeCreatorAddress(place)

  // `contact_name` comes from the scene's own scene.json, so it is the author
  // saying who made this, and it wins over the profile's display name.
  const contactName = isJunkContactName(place?.contact_name) ? undefined : place?.contact_name?.trim()
  // Genesis Plaza and the rest of the Foundation's scenes get the DCL logo, the
  // same rule /events applies, instead of a "D" disc for the biggest card on the page.
  const isFoundation = isDclFoundationCreator(contactName)

  // Via useProfileAvatar rather than the raw query so this shares the broken
  // face256 guard with /events: catalyst sometimes hands back a snapshot URL
  // the CDN 404s, and only that hook knows the URL is dead. Its background
  // color is keyed off the profile's own `ethAddress`, so a checksummed
  // `creator_address` and its lowercase `owner` twin can't disagree.
  const { avatarFace, name: profileName, backgroundColor } = useProfileAvatar(address, { skip: !address || isFoundation })

  const creatorName = isFoundation ? DCL_FOUNDATION_NAME : contactName || profileName || undefined

  // NOTE: #818 dropped the face for every scene declaring a contact name, which
  // is nearly all of them, so the feed rendered a synthetic disc almost
  // everywhere. The face now follows the address the by-line links to: one
  // identity, one picture, one profile. On a studio wallet that means the studio's
  // avatar beside the contact's name, which is what /events has always shown.
  const creditedFace = isFoundation ? DCL_FOUNDATION_LOGO_URL : avatarFace
  const creatorAvatar = creditedFace || (creatorName ? getSyntheticAvatarUrl(creatorName) : undefined)

  const avatarBg = useMemo(() => {
    if (!creatorName) return undefined
    if (isFoundation) return DCL_FOUNDATION_BACKGROUND_COLOR
    // A resolved profile already carries its ADR-292 color. Without one the
    // by-line is a free-text label with no address behind it, so it gets its own
    // deterministic color rather than borrowing somebody else's.
    if (address) return backgroundColor
    return getAvatarBackgroundColor(getDisplayName({ name: creatorName, hasClaimedName: false, ethAddress: undefined }))
  }, [creatorName, isFoundation, address, backgroundColor])

  return { creatorName, creatorAvatar, avatarBg, creatorAddress: isFoundation ? undefined : address }
}

export { usePlaceCreator }
export type { PlaceCreator }
