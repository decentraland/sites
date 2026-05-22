import type { JumpPlace } from '../../../features/places'
import { parseCoordinates } from '../../../utils/whatsOnUrl'
import type { ModalPlaceData } from './PlaceDetailModal.types'

function normalizeJumpPlace(place: JumpPlace): ModalPlaceData {
  const isWorld = Boolean(place.world)
  const worldName = isWorld ? place.world_name ?? null : null
  return {
    id: place.id,
    title: place.title,
    description: place.description || null,
    image: place.image || null,
    coordinates: parseCoordinates(place.base_position),
    ownerAddress: place.owner ?? undefined,
    ownerName: place.owner || place.contact_name || undefined,
    favorites: place.favorites ?? 0,
    userCount: place.user_count ?? 0,
    isWorld,
    worldName
  }
}

export { normalizeJumpPlace }
