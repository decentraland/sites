import type { EventEntry } from '../features/events'
import { computeUpcomingOccurrences, eventEntryToFormState, recurrenceToApi } from './useCreateEventForm.helpers'

// Format an ISO timestamp into the same `YYYY-MM-DD` / `HH:MM` shape the form fields use, so the
// tests below don't have to duplicate the local-timezone arithmetic the helper performs internally.
function asLocalFormFields(iso: string): { date: string; time: string } {
  const d = new Date(iso)
  const pad = (v: number): string => String(v).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
}

function buildEvent(overrides: Partial<EventEntry> = {}): EventEntry {
  return {
    id: 'ev-1',
    name: 'Sample event',
    description: 'desc',
    image: null,
    image_vertical: null,
    start_at: '2030-01-01T10:00:00.000Z',
    finish_at: '2030-01-01T12:00:00.000Z',
    duration: 2 * 60 * 60 * 1000,
    x: 0,
    y: 0,
    world: false,
    server: null,
    community_id: null,
    contact: null,
    recurrent: false,
    user: '0xabc',
    ...overrides
  } as unknown as EventEntry
}

describe('eventEntryToFormState', () => {
  describe('when the event is a legitimate Genesis City event (world: false)', () => {
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(buildEvent({ world: false, server: null, x: -77, y: 77 }))
    })

    it('should set the form location to land', () => {
      expect(formState.location).toBe('land')
    })

    it('should populate the coordinates from the event x and y', () => {
      expect(formState.coordX).toBe('-77')
      expect(formState.coordY).toBe('77')
    })

    it('should leave the world selector empty', () => {
      expect(formState.world).toBe('')
    })
  })

  describe('when the event is a legitimate world event (world: true with a server)', () => {
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(buildEvent({ world: true, server: 'foo.dcl.eth', x: 0, y: 0 }))
    })

    it('should set the form location to world', () => {
      expect(formState.location).toBe('world')
    })

    it('should populate the world selector with the server name', () => {
      expect(formState.world).toBe('foo.dcl.eth')
    })

    it('should zero the coordinates since worlds are not addressed by parcel', () => {
      expect(formState.coordX).toBe('0')
      expect(formState.coordY).toBe('0')
    })
  })

  describe('when the event has world: true but no server (upstream data inconsistency)', () => {
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(buildEvent({ world: true, server: null, x: -77, y: 77 }))
    })

    it('should treat it as a land event so the owner is not trapped in an empty world selector', () => {
      expect(formState.location).toBe('land')
    })

    it('should preserve the original event coordinates instead of zeroing them out', () => {
      expect(formState.coordX).toBe('-77')
      expect(formState.coordY).toBe('77')
    })

    it('should leave the world selector empty so saving sends `world: false` and clears the stale flag', () => {
      expect(formState.world).toBe('')
    })
  })

  describe('when the event has world: true with an empty-string server (defensive)', () => {
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(buildEvent({ world: true, server: '', x: -10, y: 5 }))
    })

    it('should treat it as a land event because an empty server name is not a real world reference', () => {
      expect(formState.location).toBe('land')
      expect(formState.coordX).toBe('-10')
      expect(formState.coordY).toBe('5')
    })
  })

  describe('when hydrating the combined recurrence option from a stored event', () => {
    it('should map a biweekly WEEKLY event to every_2_weeks', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_interval: 2 }))

      expect(formState.recurrence).toBe('every_2_weeks')
    })

    it('should map a plain WEEKLY event (no interval) to every_week', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_interval: null }))

      expect(formState.recurrence).toBe('every_week')
    })

    it('should map a non-positive WEEKLY interval to every_week', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_interval: 0 }))

      expect(formState.recurrence).toBe('every_week')
    })

    it('should clamp a WEEKLY interval above 4 to every_4_weeks', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_interval: 6 }))

      expect(formState.recurrence).toBe('every_4_weeks')
    })

    it('should map a DAILY event to every_day regardless of interval', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'DAILY', recurrent_interval: 14 }))

      expect(formState.recurrence).toBe('every_day')
    })

    it('should map a MONTHLY event to every_month', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'MONTHLY', recurrent_interval: 1 }))

      expect(formState.recurrence).toBe('every_month')
    })

    it('should fall back to every_week for an unsupported frequency', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'YEARLY', recurrent_interval: 1 }))

      expect(formState.recurrence).toBe('every_week')
    })
  })

  describe('when hydrating repeatDays from a stored weekly event', () => {
    // Tests run with TZ pinned to UTC (jestGlobalSetup), so local weekdays equal the stored UTC mask.
    it('should decode the UTC weekday mask into local weekday indices', () => {
      // mask 42 = Monday(2) | Wednesday(8) | Friday(32).
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_weekday_mask: 42 }))

      expect(formState.repeatDays).toEqual([1, 3, 5])
    })

    it('should fall back to the start weekday when the mask is 0', () => {
      // start_at 2030-01-01 is a Tuesday (weekday index 2).
      const formState = eventEntryToFormState(buildEvent({ recurrent: true, recurrent_frequency: 'WEEKLY', recurrent_weekday_mask: 0 }))

      expect(formState.repeatDays).toEqual([2])
    })

    it('should leave repeatDays empty for a non-recurrent event', () => {
      const formState = eventEntryToFormState(buildEvent({ recurrent: false }))

      expect(formState.repeatDays).toEqual([])
    })
  })

  describe('recurrenceToApi', () => {
    it('should map every_2_weeks to a WEEKLY frequency with interval 2', () => {
      expect(recurrenceToApi('every_2_weeks')).toEqual({ frequency: 'WEEKLY', interval: 2 })
    })

    it('should map every_day to a DAILY frequency with interval 1', () => {
      expect(recurrenceToApi('every_day')).toEqual({ frequency: 'DAILY', interval: 1 })
    })

    it('should map every_month to a MONTHLY frequency with interval 1', () => {
      expect(recurrenceToApi('every_month')).toEqual({ frequency: 'MONTHLY', interval: 1 })
    })

    it('should fall back to the default weekly option for an unknown value', () => {
      expect(recurrenceToApi('bogus')).toEqual({ frequency: 'WEEKLY', interval: 1 })
    })
  })

  describe('computeUpcomingOccurrences', () => {
    const startDate = '2030-01-01'
    const startTime = '10:00'
    const startMs = new Date(`${startDate}T${startTime}`).getTime()
    const DAY = 24 * 60 * 60 * 1000

    it('should return an empty array when the start date or time is missing', () => {
      expect(computeUpcomingOccurrences('', startTime, 'every_week', '')).toEqual([])
      expect(computeUpcomingOccurrences(startDate, '', 'every_week', '')).toEqual([])
    })

    it('should return an empty array for an unknown recurrence option', () => {
      expect(computeUpcomingOccurrences(startDate, startTime, 'bogus', '', [], startMs)).toEqual([])
    })

    it('should project five biweekly occurrences spaced exactly 14 days apart', () => {
      const dates = computeUpcomingOccurrences(startDate, startTime, 'every_2_weeks', '', [], startMs)

      expect(dates).toHaveLength(5)
      expect(dates[0].getTime()).toBe(startMs)
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i].getTime() - dates[i - 1].getTime()).toBe(14 * DAY)
      }
    })

    it('should project five daily occurrences spaced exactly 1 day apart', () => {
      const dates = computeUpcomingOccurrences(startDate, startTime, 'every_day', '', [], startMs)

      expect(dates).toHaveLength(5)
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i].getTime() - dates[i - 1].getTime()).toBe(DAY)
      }
    })

    it('should stop generating once the end date is passed', () => {
      // Weekly from Jan 1: Jan 1, Jan 8, Jan 15 land on/before Jan 20; Jan 22 is excluded.
      const dates = computeUpcomingOccurrences(startDate, startTime, 'every_week', '2030-01-20', [], startMs)

      expect(dates).toHaveLength(3)
    })

    it('should skip occurrences that already passed relative to now', () => {
      const now = startMs + 15 * DAY

      const dates = computeUpcomingOccurrences(startDate, startTime, 'every_week', '', [], now)

      expect(dates[0].getTime()).toBeGreaterThanOrEqual(now)
    })

    it('should step monthly occurrences by whole months and clamp short months', () => {
      const monthlyStart = '2030-01-31'
      const dates = computeUpcomingOccurrences(
        monthlyStart,
        startTime,
        'every_month',
        '',
        [],
        new Date(`${monthlyStart}T${startTime}`).getTime()
      )

      expect(dates).toHaveLength(5)
      // Jan 31 + 1 month clamps to Feb 28 (2030 is not a leap year).
      expect(dates[1].getMonth()).toBe(1)
      expect(dates[1].getDate()).toBe(28)
    })

    describe('when selected weekdays are provided for a weekly cadence', () => {
      // 2030-01-07 is a Monday; project Mon/Wed/Fri (1/3/5).
      const mondayStart = '2030-01-07'
      const mondayStartMs = new Date(`${mondayStart}T${startTime}`).getTime()

      it('should project every selected weekday each week', () => {
        const dates = computeUpcomingOccurrences(mondayStart, startTime, 'every_week', '', [1, 3, 5], mondayStartMs)

        expect(dates.map(d => d.getDate())).toEqual([7, 9, 11, 14, 16])
        expect(dates.map(d => d.getDay())).toEqual([1, 3, 5, 1, 3])
      })

      it('should only project selected weekdays inside active interval weeks (biweekly skips the off week)', () => {
        const dates = computeUpcomingOccurrences(mondayStart, startTime, 'every_2_weeks', '', [1, 3, 5], mondayStartMs)

        // Week of Jan 7 (Mon/Wed/Fri), then skip Jan 14 week, then week of Jan 21.
        expect(dates.map(d => d.getDate())).toEqual([7, 9, 11, 21, 23])
      })
    })
  })

  describe('when the event is recurrent and `start_at` already lies in the past (issue #474)', () => {
    // The API anchors `start_at` on the first occurrence ever and tracks the upcoming one in
    // `next_start_at`. For long-running series the anchor is months behind "now", so hydrating
    // the form from `start_at` left owners seeing a stale date and reporting "saved time was lost".
    const now = new Date('2026-05-14T12:00:00.000Z').getTime()
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(
        buildEvent({
          recurrent: true,
          start_at: '2026-01-09T00:01:00.000Z',
          next_start_at: '2026-05-15T00:01:00.000Z',
          finish_at: '2026-05-15T01:01:00.000Z'
        }),
        now
      )
    })

    it('should hydrate both the date and time from `next_start_at` so the form reflects the upcoming occurrence', () => {
      const expected = asLocalFormFields('2026-05-15T00:01:00.000Z')
      expect(formState.startDate).toBe(expected.date)
      expect(formState.startTime).toBe(expected.time)
    })
  })

  describe('when the event is recurrent and `start_at` is still upcoming', () => {
    // A user could have clicked a specific occurrence in the calendar grid — `bucketEventsByDay`
    // hands the form a virtual entry whose `start_at` already points at the chosen future date.
    // Respect that intent instead of jumping to a different `next_start_at`.
    const now = new Date('2026-05-14T12:00:00.000Z').getTime()
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(
        buildEvent({
          recurrent: true,
          start_at: '2026-05-21T18:00:00.000Z',
          next_start_at: '2026-05-15T18:00:00.000Z'
        }),
        now
      )
    })

    it('should keep both the date and time from the future `start_at` the caller already pinned', () => {
      const expected = asLocalFormFields('2026-05-21T18:00:00.000Z')
      expect(formState.startDate).toBe(expected.date)
      expect(formState.startTime).toBe(expected.time)
    })
  })

  describe('when a recurrent event omits `duration` and the form pivots to `next_start_at`', () => {
    // Defensive: if the API ever returns an event without an explicit `duration`, the helper
    // falls back to `finish_at - start_at`. With the pivot to `next_start_at`, the duration must
    // be computed against the same reference — otherwise it spans months (issue #474 follow-up).
    const now = new Date('2026-05-14T12:00:00.000Z').getTime()
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(
        buildEvent({
          recurrent: true,
          duration: 0,
          start_at: '2026-01-09T00:01:00.000Z',
          next_start_at: '2026-05-15T00:01:00.000Z',
          finish_at: '2026-05-15T01:01:00.000Z'
        }),
        now
      )
    })

    it('should derive duration from `next_start_at` → `finish_at` instead of the stale anchor', () => {
      expect(formState.duration).toBe('01:00')
    })
  })

  describe('when the event is NOT recurrent with a past `start_at`', () => {
    // Non-recurrent events have no future occurrences to pivot to — keep the original anchor so
    // owners editing a one-off event still see what they saved.
    const now = new Date('2026-05-14T12:00:00.000Z').getTime()
    let formState: ReturnType<typeof eventEntryToFormState>

    beforeEach(() => {
      formState = eventEntryToFormState(
        buildEvent({
          recurrent: false,
          start_at: '2026-01-09T00:01:00.000Z',
          next_start_at: '2026-05-15T00:01:00.000Z'
        }),
        now
      )
    })

    it('should hydrate the date and time from `start_at` without falling back to `next_start_at`', () => {
      const expected = asLocalFormFields('2026-01-09T00:01:00.000Z')
      expect(formState.startDate).toBe(expected.date)
      expect(formState.startTime).toBe(expected.time)
    })
  })
})
