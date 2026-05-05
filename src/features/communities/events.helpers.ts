import { getEnv } from '../../config/env'
import type { CommunityEventsResponse } from './communities.types'

// Lazy getter — throws only when the events query actually runs. Keeps the
// socialClient module import-safe inside the lazy DappsShell chunk.
function getEventsApiBaseUrl(): string {
  const url = getEnv('EVENTS_API_URL')
  if (!url) throw new Error('EVENTS_API_URL environment variable is not set')
  return url
}

type EventsApiEvent = {
  id: string
  name: string
  approved: boolean
  rejected: boolean
  [key: string]: unknown
}

type EventsApiResponse = {
  ok: boolean
  data: {
    events: EventsApiEvent[]
    total: number
  }
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
export type { EventsApiEvent, EventsApiResponse }
