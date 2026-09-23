import {
  ALL_WEEKDAYS,
  WEEKDAY_INDICES,
  dayIndicesToWeekdayMask,
  getFirstOccurrenceFinishAt,
  localizedWeekdayLong,
  localizedWeekdayShort,
  normalizeDayIndices,
  parseStartWeekday,
  weekdayMaskToDayIndices
} from './recurrence'

describe('recurrence helpers', () => {
  describe('WEEKDAY_INDICES / ALL_WEEKDAYS', () => {
    it('should expose Sunday-first indices 0..6', () => {
      expect(WEEKDAY_INDICES).toEqual([0, 1, 2, 3, 4, 5, 6])
      expect(ALL_WEEKDAYS).toEqual([0, 1, 2, 3, 4, 5, 6])
    })
  })

  describe('normalizeDayIndices', () => {
    it('should dedupe, drop out-of-range values, and sort ascending', () => {
      expect(normalizeDayIndices([3, 3, 0, 6, 7, -1, 2])).toEqual([0, 2, 3, 6])
    })

    it('should return an empty array when no values are in range', () => {
      expect(normalizeDayIndices([7, 8, -1])).toEqual([])
    })

    it('should return an empty array for an empty input', () => {
      expect(normalizeDayIndices([])).toEqual([])
    })
  })

  describe('dayIndicesToWeekdayMask', () => {
    it('should map Sunday (0) to bit 1', () => {
      expect(dayIndicesToWeekdayMask([0])).toBe(1)
    })

    it('should OR multiple weekdays into a single mask', () => {
      // Monday (1<<1=2) + Wednesday (1<<3=8) + Saturday (1<<6=64) = 74
      expect(dayIndicesToWeekdayMask([1, 3, 6])).toBe(74)
    })

    it('should ignore out-of-range day indices', () => {
      expect(dayIndicesToWeekdayMask([0, 7, -1])).toBe(1)
    })

    it('should produce 0 for an empty list', () => {
      expect(dayIndicesToWeekdayMask([])).toBe(0)
    })
  })

  describe('weekdayMaskToDayIndices', () => {
    it('should return all weekdays when the mask is null', () => {
      expect(weekdayMaskToDayIndices(null)).toEqual([0, 1, 2, 3, 4, 5, 6])
    })

    it('should return all weekdays when the mask is undefined', () => {
      expect(weekdayMaskToDayIndices(undefined)).toEqual([0, 1, 2, 3, 4, 5, 6])
    })

    it('should return all weekdays when the mask is 0', () => {
      expect(weekdayMaskToDayIndices(0)).toEqual([0, 1, 2, 3, 4, 5, 6])
    })

    it('should decode a specific mask back into day indices', () => {
      // 74 = Monday + Wednesday + Saturday
      expect(weekdayMaskToDayIndices(74)).toEqual([1, 3, 6])
    })

    it('should round-trip through dayIndicesToWeekdayMask', () => {
      const days = [0, 2, 5]
      expect(weekdayMaskToDayIndices(dayIndicesToWeekdayMask(days))).toEqual(days)
    })
  })

  describe('parseStartWeekday', () => {
    it('should return null for an empty string', () => {
      expect(parseStartWeekday('')).toBeNull()
    })

    it('should return null for an unparseable date', () => {
      expect(parseStartWeekday('not-a-date')).toBeNull()
    })

    it('should return the weekday index for a valid date', () => {
      // 2026-04-07 is a Tuesday → getDay() === 2 (TZ pinned to UTC by jest globalSetup)
      expect(parseStartWeekday('2026-04-07')).toBe(2)
    })

    it('should return 0 for a Sunday', () => {
      // 2026-04-05 is a Sunday
      expect(parseStartWeekday('2026-04-05')).toBe(0)
    })
  })

  describe('localizedWeekdayShort', () => {
    it('should format the day index as a short weekday name', () => {
      expect(localizedWeekdayShort(0, 'en-US')).toBe('Sun')
      expect(localizedWeekdayShort(6, 'en-US')).toBe('Sat')
    })

    it('should reuse the memoized formatter on repeated calls for the same locale/style', () => {
      // Second call hits the FORMATTER_CACHE branch.
      expect(localizedWeekdayShort(1, 'en-US')).toBe('Mon')
      expect(localizedWeekdayShort(2, 'en-US')).toBe('Tue')
    })

    it('should default to the runtime locale when none is supplied', () => {
      expect(typeof localizedWeekdayShort(3)).toBe('string')
    })
  })

  describe('localizedWeekdayLong', () => {
    it('should format the day index as a long weekday name', () => {
      expect(localizedWeekdayLong(0, 'en-US')).toBe('Sunday')
      expect(localizedWeekdayLong(5, 'en-US')).toBe('Friday')
    })
  })

  describe('getFirstOccurrenceFinishAt', () => {
    describe('when the event is recurrent and finish_at is the end of the last occurrence', () => {
      it('should return the start plus the length of one occurrence', () => {
        expect(
          getFirstOccurrenceFinishAt({
            start_at: '2026-09-23T19:00:00.000Z',
            finish_at: '2027-01-27T20:00:00.000Z',
            next_start_at: '2026-10-07T19:00:00.000Z',
            next_finish_at: '2026-10-07T20:00:00.000Z'
          })
        ).toBe('2026-09-23T20:00:00.000Z')
      })
    })

    describe('when the event is not recurrent', () => {
      it('should return the finish_at', () => {
        expect(
          getFirstOccurrenceFinishAt({
            start_at: '2026-09-23T19:00:00.000Z',
            finish_at: '2026-09-23T21:30:00.000Z',
            next_start_at: '2026-09-23T19:00:00.000Z',
            next_finish_at: '2026-09-23T21:30:00.000Z'
          })
        ).toBe('2026-09-23T21:30:00.000Z')
      })
    })

    describe('when a date is unparseable', () => {
      it('should fall back to finish_at', () => {
        expect(
          getFirstOccurrenceFinishAt({
            start_at: '2026-09-23T19:00:00.000Z',
            finish_at: '2027-01-27T20:00:00.000Z',
            next_start_at: 'not-a-date',
            next_finish_at: '2026-10-07T20:00:00.000Z'
          })
        ).toBe('2027-01-27T20:00:00.000Z')
      })
    })

    describe('when next_finish_at is before next_start_at', () => {
      it('should fall back to finish_at', () => {
        expect(
          getFirstOccurrenceFinishAt({
            start_at: '2026-09-23T19:00:00.000Z',
            finish_at: '2027-01-27T20:00:00.000Z',
            next_start_at: '2026-10-07T20:00:00.000Z',
            next_finish_at: '2026-10-07T19:00:00.000Z'
          })
        ).toBe('2027-01-27T20:00:00.000Z')
      })
    })
  })
})
