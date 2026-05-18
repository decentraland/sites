import { addDays, endOfDay, formatDayHeader, formatDayHeaderAria, getDayRange, isSameLocalDay, startOfDay } from './whatsOnDate'

const t = (key: string) => key

describe('whatsOnDate', () => {
  describe('addDays', () => {
    it('should advance the date by the supplied number of days', () => {
      const result = addDays(new Date('2026-05-01T00:00:00Z'), 3)
      expect(result.toISOString().slice(0, 10)).toBe('2026-05-04')
    })

    it('should accept negative offsets', () => {
      const result = addDays(new Date('2026-05-01T00:00:00Z'), -1)
      expect(result.toISOString().slice(0, 10)).toBe('2026-04-30')
    })
  })

  describe('startOfDay/endOfDay/getDayRange', () => {
    it('should return midnight for startOfDay', () => {
      const result = startOfDay(new Date('2026-05-01T12:34:56Z'))
      expect(result.getUTCHours()).toBe(0)
    })

    it('should return end of day with millisecond precision', () => {
      const result = endOfDay(new Date('2026-05-01T00:00:00Z'))
      expect(result.getUTCHours()).toBe(23)
      expect(result.getUTCMilliseconds()).toBe(999)
    })

    it('should return a from/to range spanning a single day', () => {
      const range = getDayRange(new Date('2026-05-01T12:00:00Z'))
      expect(range.from).toContain('2026-05-01')
      expect(range.to).toContain('2026-05-01')
    })
  })

  describe('isSameLocalDay', () => {
    it('should return true for two dates on the same calendar day', () => {
      expect(isSameLocalDay(new Date('2026-05-01T00:00:00Z'), new Date('2026-05-01T23:00:00Z'))).toBe(true)
    })

    it('should return false for different calendar days', () => {
      expect(isSameLocalDay(new Date('2026-05-01T00:00:00Z'), new Date('2026-05-02T00:00:00Z'))).toBe(false)
    })
  })

  describe('formatDayHeader', () => {
    const today = new Date('2026-05-01T12:00:00Z')

    it('should return the "today" label when the date matches today', () => {
      expect(formatDayHeader(today, t, today)).toBe('all_hangouts.today')
    })

    it('should return the "tomorrow" label for tomorrow', () => {
      const tomorrow = addDays(today, 1)
      expect(formatDayHeader(tomorrow, t, today)).toBe('all_hangouts.tomorrow')
    })

    it('should return a weekday/month/day string for other dates', () => {
      const later = addDays(today, 5)
      const result = formatDayHeader(later, t, today)
      expect(result).toMatch(/, \w+ \d+$/)
    })
  })

  describe('formatDayHeaderAria', () => {
    it('should return a locale-formatted long date string', () => {
      const result = formatDayHeaderAria(new Date('2026-05-01T12:00:00Z'))
      expect(result).toMatch(/2026/)
    })
  })
})
