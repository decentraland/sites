const envMock = jest.fn<string | undefined, [string]>(() => 'https://events-api.test')
jest.mock('../../config/env', () => ({
  getEnv: (key: string) => envMock(key)
}))

import {
  getCommunityEventCoordinates,
  getCommunityEventDuration,
  getEventsApiBaseUrl,
  mapCommunityEventToEventEntry,
  mapEventsApiResponse
} from './events.helpers'
import type { CommunityEvent } from './communities.types'
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

describe('getEventsApiBaseUrl', () => {
  beforeEach(() => {
    envMock.mockReset().mockReturnValue('https://events-api.test')
  })

  it('should return the env value when set', () => {
    expect(getEventsApiBaseUrl()).toBe('https://events-api.test')
  })

  it('should throw when EVENTS_API_URL is missing', () => {
    envMock.mockReturnValueOnce(undefined)
    expect(() => getEventsApiBaseUrl()).toThrow('EVENTS_API_URL environment variable is not set')
  })
})

describe('getCommunityEventCoordinates', () => {
  it('should prefer coordinates when supplied', () => {
    expect(getCommunityEventCoordinates({ coordinates: [10, 20] } as unknown as CommunityEvent)).toEqual([10, 20])
  })

  it('should fall back to position when coordinates are missing', () => {
    expect(getCommunityEventCoordinates({ position: [3, 4] } as unknown as CommunityEvent)).toEqual([3, 4])
  })

  it('should fall back to x/y when neither is supplied', () => {
    expect(getCommunityEventCoordinates({ x: 1, y: 2 } as unknown as CommunityEvent)).toEqual([1, 2])
  })

  it('should default to 0,0 when nothing is supplied', () => {
    expect(getCommunityEventCoordinates({} as unknown as CommunityEvent)).toEqual([0, 0])
  })
})

describe('getCommunityEventDuration', () => {
  it('should return the explicit duration when present', () => {
    expect(getCommunityEventDuration({ duration: 600 } as unknown as CommunityEvent)).toBe(600)
  })

  it('should compute the duration from startAt/finishAt in seconds', () => {
    const event = {
      startAt: '2026-05-01T00:00:00Z',
      finishAt: '2026-05-01T01:00:00Z'
    } as unknown as CommunityEvent
    expect(getCommunityEventDuration(event)).toBe(3600)
  })

  it('should return 0 when timestamps are invalid', () => {
    expect(getCommunityEventDuration({ startAt: 'no', finishAt: 'no' } as unknown as CommunityEvent)).toBe(0)
  })

  it('should return 0 when finish is before start', () => {
    expect(
      getCommunityEventDuration({ startAt: '2026-05-02T00:00:00Z', finishAt: '2026-05-01T00:00:00Z' } as unknown as CommunityEvent)
    ).toBe(0)
  })
})

describe('mapCommunityEventToEventEntry', () => {
  it('should map every camelCase field to snake_case with sensible defaults', () => {
    const event = {
      id: 'evt-1',
      name: 'Hangout',
      startAt: '2026-05-01T00:00:00Z',
      finishAt: '2026-05-01T01:00:00Z',
      coordinates: [10, 20],
      duration: 60,
      approved: true,
      rejected: false,
      attending: false,
      totalAttendees: 5,
      latestAttendees: ['0xa']
    } as unknown as CommunityEvent

    const mapped = mapCommunityEventToEventEntry(event)
    expect(mapped.id).toBe('evt-1')
    expect(mapped.start_at).toBe('2026-05-01T00:00:00Z')
    expect(mapped.finish_at).toBe('2026-05-01T01:00:00Z')
    expect(mapped.next_start_at).toBe('2026-05-01T00:00:00Z')
    expect(mapped.next_finish_at).toBe('2026-05-01T01:00:00Z')
    expect(mapped.coordinates).toEqual([10, 20])
    expect(mapped.position).toEqual([10, 20])
    expect(mapped.x).toBe(10)
    expect(mapped.y).toBe(20)
    expect(mapped.duration).toBe(60)
    expect(mapped.recurrent_dates).toEqual([])
    expect(mapped.world).toBe(false)
    expect(mapped.live).toBe(false)
    expect(mapped.highlighted).toBe(false)
    expect(mapped.trending).toBe(false)
  })

  it('should preserve explicit camelCase overrides', () => {
    const event = {
      id: 'evt-2',
      name: 'Tour',
      startAt: '2026-05-01T00:00:00Z',
      finishAt: '2026-05-01T02:00:00Z',
      coordinates: [0, 0],
      duration: 7200,
      approved: false,
      rejected: false,
      attending: true,
      totalAttendees: 1,
      latestAttendees: ['0xb'],
      nextStartAt: '2026-05-08T00:00:00Z',
      nextFinishAt: '2026-05-08T02:00:00Z',
      allDay: true,
      live: true,
      world: true,
      placeId: 'p-1',
      communityId: 'c-1',
      recurrent: true,
      recurrentFrequency: 'weekly',
      recurrentInterval: 2,
      recurrentWeekdayMask: 5,
      recurrentDates: ['2026-05-08T00:00:00Z'],
      contact: 'mail@example.test',
      details: 'details',
      categories: ['cat'],
      schedules: ['sched'],
      createdAt: '2026-04-29T00:00:00Z',
      updatedAt: '2026-04-30T00:00:00Z',
      userName: 'creator',
      user: '0xcreator'
    } as unknown as CommunityEvent

    const mapped = mapCommunityEventToEventEntry(event)
    expect(mapped.all_day).toBe(true)
    expect(mapped.live).toBe(true)
    expect(mapped.world).toBe(true)
    expect(mapped.place_id).toBe('p-1')
    expect(mapped.community_id).toBe('c-1')
    expect(mapped.next_start_at).toBe('2026-05-08T00:00:00Z')
    expect(mapped.recurrent_frequency).toBe('weekly')
    expect(mapped.recurrent_dates).toEqual(['2026-05-08T00:00:00Z'])
    expect(mapped.user_name).toBe('creator')
    expect(mapped.user).toBe('0xcreator')
  })

  it('should default every optional field to its fallback when the event is minimal', () => {
    const event = {
      id: 'evt-min',
      name: 'Min',
      startAt: '2026-05-01T00:00:00Z',
      finishAt: '2026-05-01T01:00:00Z',
      coordinates: [0, 0],
      duration: 60,
      approved: false,
      rejected: false,
      attending: false,
      totalAttendees: 0,
      latestAttendees: []
    } as unknown as CommunityEvent

    const mapped = mapCommunityEventToEventEntry(event)
    expect(mapped.description).toBeNull()
    expect(mapped.image).toBeNull()
    expect(mapped.image_vertical).toBeNull()
    expect(mapped.next_start_at).toBe(event.startAt)
    expect(mapped.next_finish_at).toBe(event.finishAt)
    expect(mapped.all_day).toBe(false)
    expect(mapped.position).toEqual([0, 0])
    expect(mapped.server).toBeNull()
    expect(mapped.url).toBe('')
    expect(mapped.user).toBe('')
    expect(mapped.user_name).toBeNull()
    expect(mapped.estate_id).toBeNull()
    expect(mapped.estate_name).toBeNull()
    expect(mapped.scene_name).toBeNull()
    expect(mapped.rejection_reason).toBeNull()
    expect(mapped.highlighted).toBe(false)
    expect(mapped.trending).toBe(false)
    expect(mapped.recurrent).toBe(false)
    expect(mapped.recurrent_frequency).toBeNull()
    expect(mapped.recurrent_interval).toBeNull()
    expect(mapped.recurrent_weekday_mask).toBeNull()
    expect(mapped.recurrent_count).toBeNull()
    expect(mapped.recurrent_until).toBeNull()
    expect(mapped.recurrent_dates).toEqual([])
    expect(mapped.contact).toBeNull()
    expect(mapped.details).toBeNull()
    expect(mapped.categories).toEqual([])
    expect(mapped.schedules).toEqual([])
    expect(mapped.world).toBe(false)
    expect(mapped.place_id).toBeNull()
    expect(mapped.community_id).toBeNull()
    expect(mapped.live).toBe(false)
    expect(mapped.created_at).toBe('')
    expect(mapped.updated_at).toBe('')
  })

  it('should pass every supplied optional field through to its snake_case counterpart', () => {
    const event = {
      id: 'evt-full',
      name: 'Full',
      startAt: '2026-05-01T00:00:00Z',
      finishAt: '2026-05-01T02:00:00Z',
      coordinates: [5, 5],
      duration: 7200,
      approved: false,
      rejected: false,
      attending: true,
      totalAttendees: 3,
      latestAttendees: ['0xa'],
      description: 'desc',
      image: 'img.png',
      imageVertical: 'imgv.png',
      server: 'server.test',
      url: 'https://event.test',
      user: '0xcreator',
      userName: 'creator',
      estateId: 'e-1',
      estateName: 'Estate',
      sceneName: 'Scene',
      rejectionReason: null,
      contact: 'mail@x.test',
      details: 'details',
      categories: ['cat'],
      schedules: ['sched'],
      placeId: 'p-1',
      communityId: 'c-1',
      createdAt: '2026-04-29T00:00:00Z',
      updatedAt: '2026-04-30T00:00:00Z'
    } as unknown as CommunityEvent

    const mapped = mapCommunityEventToEventEntry(event)
    expect(mapped.description).toBe('desc')
    expect(mapped.image).toBe('img.png')
    expect(mapped.image_vertical).toBe('imgv.png')
    expect(mapped.server).toBe('server.test')
    expect(mapped.url).toBe('https://event.test')
    expect(mapped.user).toBe('0xcreator')
    expect(mapped.user_name).toBe('creator')
    expect(mapped.estate_id).toBe('e-1')
    expect(mapped.estate_name).toBe('Estate')
    expect(mapped.scene_name).toBe('Scene')
    expect(mapped.contact).toBe('mail@x.test')
    expect(mapped.details).toBe('details')
    expect(mapped.categories).toEqual(['cat'])
    expect(mapped.schedules).toEqual(['sched'])
    expect(mapped.place_id).toBe('p-1')
    expect(mapped.community_id).toBe('c-1')
    expect(mapped.created_at).toBe('2026-04-29T00:00:00Z')
    expect(mapped.updated_at).toBe('2026-04-30T00:00:00Z')
  })
})
