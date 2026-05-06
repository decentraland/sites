import { getEnv } from '../../config/env'
import type { CommunityEventsResponse } from './communities.types'
import type { EventsApiResponse } from './events.helpers.types'

// TODO(post-prod): the snake_case → camelCase mapping below duplicates the
// shape conversions already performed in `src/features/whats-on-events/events.helpers.ts`.
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

export { getEventsApiBaseUrl, mapEventsApiResponse }
