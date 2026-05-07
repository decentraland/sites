jest.mock('../../../config/env', () => ({
  getEnv: () => 'https://events-api.test'
}))

import { mapEventsApiResponse } from './events.helpers'
import type { EventsApiResponse } from './events.helpers.types'

describe('mapEventsApiResponse', () => {
  describe('when the upstream response carries snake_case event fields', () => {
    let response: EventsApiResponse

    beforeEach(() => {
      response = {
        ok: true,
        data: {
          events: [
            {
              id: 'evt-1',
              name: 'Test event',
              approved: true,
              rejected: false,
              description: 'desc',
              image: 'https://image.test/1.png',
              start_at: '2026-05-08T15:30:00Z',
              finish_at: '2026-05-08T17:30:00Z',
              scene_name: 'Genesis Plaza',
              total_attendees: 42,
              latest_attendees: ['0xabc', '0xdef'],
              all_day: false,
              community_id: 'c-1',
              created_at: '2026-05-01T00:00:00Z',
              estate_id: 'e-1',
              estate_name: 'Estate One',
              image_vertical: 'https://image.test/1-v.png',
              next_start_at: '2026-05-15T15:30:00Z',
              next_finish_at: '2026-05-15T17:30:00Z',
              place_id: 'p-1',
              recurrent_dates: ['2026-05-15T15:30:00Z'],
              recurrent_frequency: 'weekly',
              rejection_reason: null,
              updated_at: '2026-05-02T00:00:00Z',
              user_name: 'creator-name'
            }
          ],
          total: 1
        }
      }
    })

    it('should map every snake_case key to camelCase', () => {
      const result = mapEventsApiResponse(response)
      const event = result.data.events[0]
      expect(event.startAt).toBe('2026-05-08T15:30:00Z')
      expect(event.finishAt).toBe('2026-05-08T17:30:00Z')
      expect(event.sceneName).toBe('Genesis Plaza')
      expect(event.totalAttendees).toBe(42)
      expect(event.latestAttendees).toEqual(['0xabc', '0xdef'])
      expect(event.allDay).toBe(false)
      expect(event.communityId).toBe('c-1')
      expect(event.createdAt).toBe('2026-05-01T00:00:00Z')
      expect(event.estateId).toBe('e-1')
      expect(event.estateName).toBe('Estate One')
      expect(event.imageVertical).toBe('https://image.test/1-v.png')
      expect(event.nextStartAt).toBe('2026-05-15T15:30:00Z')
      expect(event.nextFinishAt).toBe('2026-05-15T17:30:00Z')
      expect(event.placeId).toBe('p-1')
      expect(event.recurrentDates).toEqual(['2026-05-15T15:30:00Z'])
      expect(event.recurrentFrequency).toBe('weekly')
      expect(event.rejectionReason).toBeNull()
      expect(event.updatedAt).toBe('2026-05-02T00:00:00Z')
      expect(event.userName).toBe('creator-name')
    })

    it('should drop the original snake_case keys', () => {
      const result = mapEventsApiResponse(response)
      const raw = result.data.events[0] as unknown as Record<string, unknown>
      expect(raw.start_at).toBeUndefined()
      expect(raw.finish_at).toBeUndefined()
      expect(raw.total_attendees).toBeUndefined()
      expect(raw.latest_attendees).toBeUndefined()
      expect(raw.scene_name).toBeUndefined()
      expect(raw.user_name).toBeUndefined()
      expect(raw.community_id).toBeUndefined()
    })

    it('should preserve passthrough properties', () => {
      const result = mapEventsApiResponse(response)
      const event = result.data.events[0]
      expect(event.id).toBe('evt-1')
      expect(event.name).toBe('Test event')
      expect(event.approved).toBe(true)
      expect(event.rejected).toBe(false)
      expect(event.description).toBe('desc')
      expect(event.image).toBe('https://image.test/1.png')
    })

    it('should keep top-level envelope fields', () => {
      const result = mapEventsApiResponse(response)
      expect(result.ok).toBe(true)
      expect(result.data.total).toBe(1)
    })
  })

  describe('when the upstream omits optional fields', () => {
    it('should default totalAttendees to 0 and latestAttendees to []', () => {
      const result = mapEventsApiResponse({
        ok: true,
        data: {
          events: [
            {
              id: 'evt-2',
              name: 'Sparse event',
              approved: true,
              rejected: false,
              start_at: '2026-06-01T00:00:00Z',
              finish_at: '2026-06-01T01:00:00Z'
            }
          ],
          total: 1
        }
      })
      const event = result.data.events[0]
      expect(event.totalAttendees).toBe(0)
      expect(event.latestAttendees).toEqual([])
      expect(event.sceneName).toBeUndefined()
      expect(event.startAt).toBe('2026-06-01T00:00:00Z')
    })
  })

  describe('when the upstream events array is empty', () => {
    it('should return an empty events array and propagate total', () => {
      const result = mapEventsApiResponse({ ok: true, data: { events: [], total: 0 } })
      expect(result.data.events).toEqual([])
      expect(result.data.total).toBe(0)
    })
  })
})
