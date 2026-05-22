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
  })

  describe('formatUtcTooltip', () => {
    describe('when UTC and local share the same calendar day', () => {
      it('should use the same-day translation key', () => {
        expect(formatUtcTooltip('2026-04-07T10:00:00Z', 'en-US', t)).toBe('event_time.utc_same_day:{"time":"10:00 AM"}')
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
