import type { EventEntry, LiveNowCard } from '../../../features/whats-on-events'
import { buildEventJumpInUrl, buildJumpInUrl, parseCoordinates } from '../../../utils/whatsOnUrl'
import type { ModalEventData } from './EventDetailModal.types'

function normalizeEventEntry(event: EventEntry): ModalEventData {
  return {
    id: event.id,
    name: event.name,
    description: event.description,
    image: event.image,
    x: event.x,
    y: event.y,
    creatorAddress: event.user || undefined,
    creatorName: event.user_name || undefined,
    startAt: event.start_at,
    finishAt: event.finish_at,
    recurrent: event.recurrent,
    recurrentFrequency: event.recurrent_frequency,
    recurrentDates: event.recurrent_dates,
    totalAttendees: event.total_attendees,
    attending: event.attending,
    live: event.live,
    categories: event.categories,
    url: buildEventJumpInUrl(event.x, event.y),
    isEvent: true
  }
}

function normalizeLiveNowCard(card: LiveNowCard): ModalEventData {
  const [x, y] = parseCoordinates(card.coordinates)
  const url = card.type === 'event' ? buildEventJumpInUrl(x, y) : buildJumpInUrl(x, y)
  return {
    id: card.id,
    name: card.title,
    description: card.description || null,
    image: card.image || null,
    x,
    y,
    creatorAddress: card.creatorAddress,
    creatorName: card.creatorName,
    startAt: card.startAt ?? null,
    finishAt: card.finishAt ?? null,
    recurrent: card.recurrent ?? false,
    recurrentFrequency: card.recurrentFrequency ?? null,
    recurrentDates: card.recurrentDates ?? [],
    totalAttendees: card.users,
    attending: card.attending,
    live: true,
    categories: card.categories ?? [],
    url,
    isEvent: card.type === 'event'
  }
}

export { normalizeEventEntry, normalizeLiveNowCard }
