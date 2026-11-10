import { DownloadTarget } from '../../modules/segment'
import { clickTrackingAttributes, daysBetween, formatAmount, formatDateRange, formatShortDate, formatUsd } from './CreatorFund.helpers'

describe('CreatorFund helpers', () => {
  describe('when formatting amounts', () => {
    it('should group thousands with en-US separators', () => {
      expect(formatAmount(30000)).toBe('30,000')
    })

    it('should prefix USD amounts with a dollar sign', () => {
      expect(formatUsd(10000)).toBe('$10,000')
    })
  })

  describe('when counting days between two ISO dates', () => {
    it('should return the number of calendar days', () => {
      expect(daysBetween('2026-11-01', '2027-01-10')).toBe(70)
    })
  })

  describe('when formatting a short date', () => {
    it('should render month and day in the visitor locale', () => {
      expect(formatShortDate('en', '2026-11-11')).toBe('Nov 11')
    })

    it('should add the year when asked to', () => {
      expect(formatShortDate('en', '2027-01-10', true)).toBe('Jan 10, 2027')
    })

    it('should keep the calendar day regardless of the visitor time zone', () => {
      // Midnight UTC is still the previous day in the Americas; the date must not shift.
      expect(formatShortDate('en', '2026-12-01')).toBe('Dec 1')
    })

    it('should localize the date for other locales', () => {
      expect(formatShortDate('ja', '2026-11-15')).toBe('11月15日')
    })
  })

  describe('when formatting a date range', () => {
    it('should collapse the shared month', () => {
      expect(formatDateRange('en', '2026-11-15', '2026-11-30')).toMatch(/^Nov 15\s*–\s*30$/)
    })
  })

  describe('when building click tracking attributes', () => {
    it('should tag the control with the Creator Fund place, the section and the button name', () => {
      expect(clickTrackingAttributes('hero-banner', 'Join From Creator Hub')).toEqual({
        'data-place': 'Creator Fund',
        'data-event': 'Click',
        'data-section': 'hero-banner',
        'data-button': 'Join From Creator Hub'
      })
    })

    it('should add the download target for download links', () => {
      expect(clickTrackingAttributes('how-it-works', 'Download Creator Hub', DownloadTarget.CREATOR_HUB)).toHaveProperty(
        'data-download-target',
        'creator_hub'
      )
    })
  })
})
