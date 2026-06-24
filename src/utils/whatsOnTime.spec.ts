import {
  formatLocalDate,
  formatLocalTime,
  formatUtcDate,
  formatUtcRangeTooltip,
  formatUtcTime,
  formatUtcTooltip,
  getRelativeTimeLabel,
  getUtcDayDelta
} from './whatsOnTime'

const t = (key: string, values?: Record<string, string | number>) => (values ? `${key}:${JSON.stringify(values)}` : key)

// The jest globalSetup pins TZ to UTC, so getUtcDayDelta naturally returns 0 for every date.
// To exercise the ±1 branches we override the UTC date getter by a fixed shift, mirroring a
// real negative/positive timezone offset that rolls the local calendar day across midnight UTC.
const shiftUtcDate = (shift: number): jest.SpyInstance => {
  // Compute the real UTC day-of-month arithmetically from the epoch ms so the spy never calls
  // back into the (now-spied) Date.prototype.getUTCDate — that would recurse infinitely, and a
  // bound reference to the original method would trip @typescript-eslint/unbound-method.
  const msPerDay = 24 * 60 * 60 * 1000
  return jest.spyOn(Date.prototype, 'getUTCDate').mockImplementation(function (this: Date) {
    const utcMidnightMs = Math.floor(this.getTime() / msPerDay) * msPerDay
    // ISO date string is always UTC; slice the day-of-month out of `YYYY-MM-DDT...`.
    const realUtcDay = Number(new Date(utcMidnightMs).toISOString().slice(8, 10))
    return realUtcDay + shift
  })
}

describe('whatsOnTime helpers', () => {
  describe('formatLocalTime', () => {
    it('should format a UTC timestamp in the host timezone using 12h with minutes', () => {
      expect(formatLocalTime('2026-04-07T10:00:00Z', 'en-US')).toBe('10:00 AM')
    })
  })

  describe('formatLocalDate', () => {
    it('should format a UTC timestamp in the host timezone with short weekday and month', () => {
      expect(formatLocalDate('2026-04-07T10:00:00Z', 'en-US')).toBe('Tue, Apr 7')
    })
  })

  describe('getUtcDayDelta', () => {
    describe('when local and UTC fall on the same calendar day', () => {
      it('should return 0', () => {
        expect(getUtcDayDelta('2026-04-07T10:00:00Z')).toBe(0)
      })
    })

    describe('when the ISO string is not parseable', () => {
      it('should return 0', () => {
        expect(getUtcDayDelta('not-a-date')).toBe(0)
      })
    })

    describe('when the UTC day is ahead of the local day', () => {
      let spy: jest.SpyInstance
      beforeEach(() => {
        spy = shiftUtcDate(1)
      })
      afterEach(() => spy.mockRestore())

      it('should return 1', () => {
        expect(getUtcDayDelta('2026-04-07T23:00:00Z')).toBe(1)
      })
    })

    describe('when the UTC day is behind the local day', () => {
      let spy: jest.SpyInstance
      beforeEach(() => {
        spy = shiftUtcDate(-1)
      })
      afterEach(() => spy.mockRestore())

      it('should return -1', () => {
        expect(getUtcDayDelta('2026-04-07T01:00:00Z')).toBe(-1)
      })
    })
  })

  describe('formatUtcTooltip', () => {
    describe('when UTC and local share the same calendar day', () => {
      it('should use the same-day translation key', () => {
        expect(formatUtcTooltip('2026-04-07T10:00:00Z', 'en-US', t)).toBe('event_time.utc_same_day:{"time":"10:00 AM"}')
      })
    })

    describe('when the UTC day is one ahead of the local day', () => {
      let spy: jest.SpyInstance
      beforeEach(() => {
        spy = shiftUtcDate(1)
      })
      afterEach(() => spy.mockRestore())

      it('should use the next-day translation key', () => {
        expect(formatUtcTooltip('2026-04-07T23:00:00Z', 'en-US', t)).toBe('event_time.utc_next_day:{"time":"11:00 PM"}')
      })
    })

    describe('when the UTC day is one behind the local day', () => {
      let spy: jest.SpyInstance
      beforeEach(() => {
        spy = shiftUtcDate(-1)
      })
      afterEach(() => spy.mockRestore())

      it('should use the previous-day translation key', () => {
        expect(formatUtcTooltip('2026-04-07T01:00:00Z', 'en-US', t)).toBe('event_time.utc_previous_day:{"time":"1:00 AM"}')
      })
    })
  })

  describe('formatUtcRangeTooltip', () => {
    describe('when start and end both fall on the same UTC calendar day', () => {
      it('should use the range-same-day translation key', () => {
        expect(formatUtcRangeTooltip('2026-04-07T10:00:00Z', '2026-04-07T12:00:00Z', 'en-US', t)).toBe(
          'event_time.utc_range_same_day:{"start":"10:00 AM","end":"12:00 PM"}'
        )
      })
    })

    describe('when there is no end time', () => {
      it('should fall back to the single tooltip', () => {
        expect(formatUtcRangeTooltip('2026-04-07T10:00:00Z', null, 'en-US', t)).toBe('event_time.utc_same_day:{"time":"10:00 AM"}')
      })
    })

    describe('when the UTC calendar day differs from the local day', () => {
      // The jest globalSetup pins TZ to UTC, so getUtcDayDelta is naturally always 0. To exercise
      // the "with dates" branch we shift the UTC date getter ahead by one, mirroring users in a
      // negative-offset timezone whose event rolls past midnight UTC.
      let spy: jest.SpyInstance

      beforeEach(() => {
        spy = shiftUtcDate(1)
      })

      afterEach(() => spy.mockRestore())

      it('should use the range-with-dates translation key', () => {
        const result = formatUtcRangeTooltip('2026-04-07T10:00:00Z', '2026-04-07T23:30:00Z', 'en-US', t)
        expect(result).toContain('event_time.utc_range_with_dates')
        expect(result).toContain('"start":"10:00 AM"')
        expect(result).toContain('"end":"11:30 PM"')
      })
    })
  })

  describe('formatUtcTime', () => {
    it('should format a UTC timestamp in UTC tz', () => {
      expect(formatUtcTime('2026-04-07T10:00:00Z', 'en-US')).toBe('10:00 AM')
    })
  })

  describe('formatUtcDate', () => {
    it('should format a UTC timestamp as a short weekday/month/day', () => {
      expect(formatUtcDate('2026-04-07T10:00:00Z', 'en-US')).toBe('Tue, Apr 7')
    })
  })

  describe('getRelativeTimeLabel', () => {
    // 2026-04-07T12:00:00Z — UTC noon on a Tuesday
    const now = new Date('2026-04-07T12:00:00Z').getTime()
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(now)
    })
    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should return the local time when the event already started', () => {
      const past = '2026-04-07T11:00:00Z'
      expect(getRelativeTimeLabel(past, t)).toBe(formatLocalTime(past))
    })

    it('should return "starts_in_mins" when less than an hour away', () => {
      const soon = '2026-04-07T12:30:00Z'
      expect(getRelativeTimeLabel(soon, t)).toContain('upcoming.starts_in_mins')
    })

    it('should return "today_at" for an event later the same local day', () => {
      // 8 hours after now — still the same calendar day in UTC (and most local TZs)
      const laterToday = '2026-04-07T20:00:00Z'
      const result = getRelativeTimeLabel(laterToday, t)
      expect(result).toContain('upcoming.today_at')
      expect(result).toContain(formatLocalTime(laterToday))
    })

    it('should return "tomorrow_at" for an event starting the next local day', () => {
      const tomorrow = '2026-04-08T10:00:00Z'
      const result = getRelativeTimeLabel(tomorrow, t)
      expect(result).toContain('upcoming.tomorrow_at')
      expect(result).toContain(formatLocalTime(tomorrow))
    })

    it('should return the local time for events more than a day away', () => {
      const farFuture = '2026-04-10T10:00:00Z'
      expect(getRelativeTimeLabel(farFuture, t)).toBe(formatLocalTime(farFuture))
    })
  })
})
