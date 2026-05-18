import { formatLocalDate, formatLocalTime, formatUtcRangeTooltip, formatUtcTooltip, getUtcDayDelta } from './whatsOnTime'

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
})
