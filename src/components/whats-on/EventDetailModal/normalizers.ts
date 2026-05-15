import type { EventEntry, LiveNowCard } from '../../../features/events'
import { weekdayMaskToDayIndices } from '../../../utils/recurrence'
import { buildEventJumpInUrl, buildJumpInUrl, parseCoordinates, resolveEventRealm } from '../../../utils/whatsOnUrl'
import type { ModalEventData } from './EventDetailModal.types'

// Decode the server's WeekdayMask into a sorted day-of-week array. Returns undefined when the
// event has no per-weekday selection so getRecurrenceLabel falls through to the frequency label.
function decodeRecurrentByDay(mask: number | null | undefined): number[] | undefined {
  if (mask === null || mask === undefined || mask === 0) return undefined
  return weekdayMaskToDayIndices(mask)
}

function normalizeEventEntry(event: EventEntry): ModalEventData {
  const realm = resolveEventRealm(event.world, event.server)
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
    recurrentInterval: event.recurrent_interval,
    recurrentCount: event.recurrent_count,
    recurrentUntil: event.recurrent_until,
    recurrentByDay: decodeRecurrentByDay(event.recurrent_weekday_mask),
    recurrentDates: event.recurrent_dates,
    totalAttendees: event.total_attendees,
    attending: event.attending,
    live: event.live,
    categories: event.categories,
    url: buildEventJumpInUrl(event.x, event.y, realm),
    realm,
    isWorld: event.world,
    placeName: event.scene_name ?? event.estate_name ?? null,
    isEvent: true
  }
}

function normalizeLiveNowCard(card: LiveNowCard): ModalEventData {
  const [x, y] = parseCoordinates(card.coordinates)
  const realm = resolveEventRealm(card.world, card.server)
  const url = card.type === 'event' ? buildEventJumpInUrl(x, y, realm) : buildJumpInUrl(x, y, realm)
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
    recurrentInterval: card.recurrentInterval ?? null,
    recurrentCount: card.recurrentCount ?? null,
    recurrentUntil: card.recurrentUntil ?? null,
    recurrentByDay: decodeRecurrentByDay(card.recurrentWeekdayMask),
    recurrentDates: card.recurrentDates ?? [],
    totalAttendees: card.users,
    attending: card.attending,
    live: true,
    categories: card.categories ?? [],
    url,
    realm,
    isWorld: card.world ?? false,
    placeName: card.type === 'place' ? card.title : null,
    isEvent: card.type === 'event'
  }
}

export { normalizeEventEntry, normalizeLiveNowCard }
