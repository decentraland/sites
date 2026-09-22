import { getEventStatus, getRelativeDateLabel } from './PendingEventCard.helpers'

const translate = (key: string, values?: Record<string, string | number>): string => (values ? `${key}:${JSON.stringify(values)}` : key)

describe('when computing the relative date label', () => {
  let now: Date

  beforeEach(() => {
    now = new Date('2026-04-21T12:00:00Z')
    jest.useFakeTimers().setSystemTime(now)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('and the start time is today', () => {
    it('should return the today translation key', () => {
      expect(getRelativeDateLabel('2026-04-21T18:00:00Z', translate)).toBe('whats_on_admin.pending_events.today')
    })
  })

  describe('and the start time is tomorrow', () => {
    it('should return the tomorrow translation key', () => {
      expect(getRelativeDateLabel('2026-04-22T10:00:00Z', translate)).toBe('whats_on_admin.pending_events.tomorrow')
    })
  })

  describe('and the start time is 3 days away', () => {
    it('should return the in-n-days translation with count=3', () => {
      expect(getRelativeDateLabel('2026-04-24T10:00:00Z', translate)).toBe('whats_on_admin.pending_events.in_n_days:{"count":3}')
    })
  })

  describe('and the start time is 10 days away', () => {
    it('should return a short month+day label', () => {
      const label = getRelativeDateLabel('2026-05-01T10:00:00Z', translate)
      expect(label).toMatch(/^\d{2}\s[A-Z]{3}$|^[A-Z]{3}\s\d{2}$/)
    })
  })

  describe('and the start time is missing', () => {
    it('should return an empty string', () => {
      expect(getRelativeDateLabel(null, translate)).toBe('')
    })
  })
})

describe('when resolving the event status', () => {
  describe('and the event is neither approved nor rejected', () => {
    it('should return pending', () => {
      expect(getEventStatus({ approved: false, rejected: false })).toBe('pending')
    })
  })

  describe('and the event is approved', () => {
    it('should return approved', () => {
      expect(getEventStatus({ approved: true, rejected: false })).toBe('approved')
    })
  })

  describe('and the event is rejected', () => {
    it('should return rejected even if approved flag is also set', () => {
      expect(getEventStatus({ approved: true, rejected: true })).toBe('rejected')
    })
  })
})
