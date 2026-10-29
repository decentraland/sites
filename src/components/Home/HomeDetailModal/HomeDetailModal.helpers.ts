import { ExploreCardType } from '../../../features/events/events.discovery.types'
import type { ExploreItem } from '../../../features/events/events.discovery.types'
import type { LiveNowCard } from '../../../features/events/events.helpers'
import type { HomeDetailSelection } from './HomeDetailModal.types'

function selectionFromExploreItem(item: ExploreItem): HomeDetailSelection {
  return item.type === ExploreCardType.EVENT ? { kind: 'event', id: item.id } : { kind: 'place', item }
}

// Where the card used to lead: the page that shows the same detail, used when the in-place modal cannot load.
function canonicalPathForSelection(selection: HomeDetailSelection): string {
  return selection.kind === 'event' ? `/events?id=${encodeURIComponent(selection.id)}` : `/places/place/${selection.item.coordinates}`
}

function liveNowCardFromExploreItem(item: ExploreItem): LiveNowCard {
  const { type, id, title, image, users, coordinates, creatorAddress, creatorName, isGenesisPlaza } = item
  return { type, id, title, image, users, coordinates, creatorAddress, creatorName, isGenesisPlaza }
}

function selectionKey(selection: HomeDetailSelection): string {
  return selection.kind === 'event' ? `event:${selection.id}` : `place:${selection.item.coordinates}`
}

export { canonicalPathForSelection, liveNowCardFromExploreItem, selectionFromExploreItem, selectionKey }
