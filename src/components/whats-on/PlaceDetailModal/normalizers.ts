import type { JumpPlace } from '../../../features/jump'
import type { ModalPlaceData } from './PlaceDetailModal.types'

function normalizeJumpPlace(place: JumpPlace): ModalPlaceData {
  const [x, y] = place.base_position.split(',').map(Number) as [number, number]
  const isWorld = Boolean(place.world)
  const worldName = isWorld ? place.world_name ?? null : null
  return {
    id: place.id,
    title: place.title,
    description: place.description || null,
    image: place.image || null,
    coordinates: [x, y],
    ownerAddress: place.owner ?? undefined,
    ownerName: place.owner || place.contact_name || undefined,
    favorites: place.favorites ?? 0,
    userCount: place.user_count ?? 0,
    isWorld,
    worldName
  }
}

export { normalizeJumpPlace }
