import { getEnv } from '../../config/env'
import type { EventEntry } from '../events'
import type { CommunityEvent, CommunityEventsResponse } from './communities.types'
import type { EventsApiResponse } from './events.helpers.types'

// TODO(post-prod): the snake_case → camelCase mapping below duplicates the
// shape conversions already performed in `src/features/events/events.helpers.ts`.
// Once the social migration ships, extract the shared event-shape mapper into a single
// helper consumed by both the whats-on and the communities event clients. Today they're
// kept separate to scope the migration; the duplication is intentional but temporary.

// Lazy getter — throws only when the events query actually runs. Keeps the
// socialClient module import-safe inside the lazy DappsShell chunk.
function getEventsApiBaseUrl(): string {
  const url = getEnv('EVENTS_API_URL')
  if (!url) throw new Error('EVENTS_API_URL environment variable is not set')
  return url
}

function mapEventsApiResponse(response: EventsApiResponse): CommunityEventsResponse {
  return {
    ...response,
    data: {
      ...response.data,
      events: response.data.events.map(event => {
        const {
          ['all_day']: allDay,
          ['community_id']: communityId,
          ['created_at']: createdAt,
          ['estate_id']: estateId,
          ['estate_name']: estateName,
          ['start_at']: startAt,
          ['finish_at']: finishAt,
          ['image_vertical']: imageVertical,
          ['next_start_at']: nextStartAt,
          ['next_finish_at']: nextFinishAt,
          ['place_id']: placeId,
          ['recurrent_dates']: recurrentDates,
          ['recurrent_frequency']: recurrentFrequency,
          ['recurrent_interval']: recurrentInterval,
          ['rejection_reason']: rejectionReason,
          ['scene_name']: sceneName,
          ['total_attendees']: totalAttendees,
          ['latest_attendees']: latestAttendees,
          ['updated_at']: updatedAt,
          ['user_name']: userName,
          ...rest
        } = event
        return {
          ...rest,
          allDay: allDay as boolean | undefined,
          communityId: communityId as string | null | undefined,
          createdAt: createdAt as string | undefined,
          estateId: estateId as string | null | undefined,
          estateName: estateName as string | null | undefined,
          startAt: startAt as string,
          finishAt: finishAt as string,
          imageVertical: imageVertical as string | null | undefined,
          nextStartAt: nextStartAt as string | undefined,
          nextFinishAt: nextFinishAt as string | undefined,
          placeId: placeId as string | null | undefined,
          recurrentDates: recurrentDates as string[] | undefined,
          recurrentFrequency: recurrentFrequency as string | null | undefined,
          recurrentInterval: recurrentInterval as number | null | undefined,
          rejectionReason: rejectionReason as string | null | undefined,
          sceneName: sceneName as string | undefined,
          totalAttendees: (totalAttendees as number) ?? 0,
          latestAttendees: (latestAttendees as string[]) ?? [],
          updatedAt: updatedAt as string | undefined,
          userName: userName as string | null | undefined
        } as CommunityEventsResponse['data']['events'][number]
      })
    }
  }
}

function getCommunityEventCoordinates(event: CommunityEvent): [number, number] {
  return [event.coordinates?.[0] ?? event.position?.[0] ?? event.x ?? 0, event.coordinates?.[1] ?? event.position?.[1] ?? event.y ?? 0]
}

function getCommunityEventDuration(event: CommunityEvent): number {
  if (event.duration !== undefined) return event.duration
  const start = new Date(event.startAt).getTime()
  const finish = new Date(event.finishAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(finish)) return 0
  return Math.max(0, Math.floor((finish - start) / 1000))
}

/* eslint-disable @typescript-eslint/naming-convention */
function mapCommunityEventToEventEntry(event: CommunityEvent): EventEntry {
  const coordinates = getCommunityEventCoordinates(event)
  return {
    id: event.id,
    name: event.name,
    description: event.description ?? null,
    image: event.image ?? null,
    image_vertical: event.imageVertical ?? null,
    start_at: event.startAt,
    finish_at: event.finishAt,
    next_start_at: event.nextStartAt ?? event.startAt,
    next_finish_at: event.nextFinishAt ?? event.finishAt,
    duration: getCommunityEventDuration(event),
    all_day: event.allDay ?? false,
    x: coordinates[0],
    y: coordinates[1],
    coordinates,
    position: event.position ?? coordinates,
    server: event.server ?? null,
    url: event.url ?? '',
    user: event.user ?? '',
    user_name: event.userName ?? null,
    estate_id: event.estateId ?? null,
    estate_name: event.estateName ?? null,
    scene_name: event.sceneName ?? null,
    approved: event.approved,
    rejected: event.rejected,
    rejection_reason: event.rejectionReason ?? null,
    highlighted: event.highlighted ?? false,
    trending: event.trending ?? false,
    recurrent: event.recurrent ?? false,
    recurrent_frequency: (event.recurrentFrequency ?? null) as EventEntry['recurrent_frequency'],
    recurrent_interval: event.recurrentInterval ?? null,
    recurrent_dates: event.recurrentDates ?? [],
    contact: event.contact ?? null,
    details: event.details ?? null,
    categories: event.categories ?? [],
    schedules: event.schedules ?? [],
    world: event.world ?? false,
    place_id: event.placeId ?? null,
    community_id: event.communityId ?? null,
    total_attendees: event.totalAttendees,
    latest_attendees: event.latestAttendees,
    attending: event.attending,
    live: event.live ?? false,
    created_at: event.createdAt ?? '',
    updated_at: event.updatedAt ?? ''
  }
}
/* eslint-enable @typescript-eslint/naming-convention */

export { getCommunityEventCoordinates, getCommunityEventDuration, getEventsApiBaseUrl, mapCommunityEventToEventEntry, mapEventsApiResponse }
