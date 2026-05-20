import type { ProfilePlace } from '../../../features/profile/profile.places.client'
import { parseCoordinates } from '../../../utils/whatsOnUrl'
import type { ModalPlaceData } from '../../whats-on/PlaceDetailModal'

// Map the lightweight ProfilePlace shape returned by `/places?owner=` and
// `/worlds?owner=` into the rich ModalPlaceData consumed by the whats-on
// PlaceDetailModal. Coordinate fallback follows the same order as
// ProfileSurface places tab: base_position → first entry of positions[].
function normalizeProfilePlace(place: ProfilePlace): ModalPlaceData {
  const isWorld = Boolean(place.world)
  const worldName = isWorld ? place.world_name ?? null : null
  const rawPosition = place.base_position ?? place.positions?.[0] ?? '0,0'
  const coordinates = parseCoordinates(rawPosition)
  return {
    id: place.id,
    title: place.title,
    description: place.description ?? null,
    image: place.image ?? null,
    coordinates,
    ownerAddress: place.owner ?? undefined,
    ownerName: place.owner ?? place.contact_name ?? undefined,
    favorites: place.favorites ?? place.likes ?? 0,
    userCount: place.user_count ?? 0,
    isWorld,
    worldName
  }
}

export { normalizeProfilePlace }
