/* eslint-disable @typescript-eslint/naming-convention */
import decentralandLogo from '../../images/jump/decentraland-logo.svg'
import { resolveEventRealm } from '../../utils/whatsOnUrl'
import type { CardData, JumpEvent, JumpPlace } from './jump.types'

const FOUNDATION_CONTACT_NAME = 'Decentraland Foundation'

function fromPlace(data: JumpPlace): CardData {
  const coordinates = data.base_position.split(',').map(Number) as [number, number]
  // Only show the Decentraland logo for places explicitly credited to the
  // foundation. User-deployed places can also have owner=null + a contact_name
  // (e.g. "Pink Oasis"), and those should fall back to the generic avatar.
  const isFoundationPlace = data.contact_name === FOUNDATION_CONTACT_NAME
  return {
    id: data.id,
    type: 'place',
    title: data.title,
    user_name: data.owner || data.contact_name || 'Unknown',
    user: data.owner ?? undefined,
    user_avatar: isFoundationPlace ? decentralandLogo : undefined,
    coordinates,
    image: data.image,
    description: data.description,
    user_count: data.user_count || 0,
    favorites: data.favorites,
    url: data.url,
    position: coordinates.join(','),
    realm: data.world ? data.world_name : undefined
  }
}

function fromEvent(data: JumpEvent): CardData {
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }
  const startDate = new Date(data.next_start_at)
  const finishDate = new Date(data.next_finish_at)

  return {
    id: data.id,
    type: 'event',
    title: data.name,
    user_name: data.user_name,
    user: data.user,
    coordinates: data.coordinates,
    image: data.image,
    description: data.description,
    start_at: startDate.toLocaleDateString('en-US', dateOptions),
    finish_at: finishDate.toLocaleDateString('en-US', dateOptions),
    start_at_iso: data.next_start_at,
    finish_at_iso: data.next_finish_at,
    recurrent: data.recurrent,
    total_attendees: data.total_attendees,
    attending: data.attending,
    live: data.live,
    scene_name: data.scene_name,
    url: data.url,
    position: data.coordinates.join(','),
    realm: resolveEventRealm(data.world, data.server)
  }
}

interface GenericPlaceArgs {
  coordinates: [number, number]
  realm?: string
}

function buildGenericPlace({ coordinates, realm }: GenericPlaceArgs): CardData {
  return {
    id: 'generic-place',
    type: 'place',
    title: realm || '',
    user_name: 'Unknown',
    coordinates,
    image: undefined,
    description: undefined,
    user_count: 0,
    favorites: 0,
    scene_name: 'Decentraland',
    position: coordinates.join(','),
    realm
  }
}

export { buildGenericPlace, fromEvent, fromPlace }
