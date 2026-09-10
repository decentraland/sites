import { isAnalyticsExemptPath } from './isAnalyticsExemptPath'

describe('isAnalyticsExemptPath', () => {
  describe('when the pathname is a pure legal/text route or the download landing', () => {
    it.each(['/brand', '/content', '/download', '/ethics', '/privacy', '/referral-terms', '/rewards-terms', '/security', '/terms'])(
      'should return true for %s',
      pathname => {
        expect(isAnalyticsExemptPath(pathname)).toBe(true)
      }
    )
  })

  describe('when the pathname is a legal route with a trailing slash', () => {
    it.each(['/brand/', '/terms/'])('should still return true for %s', pathname => {
      expect(isAnalyticsExemptPath(pathname)).toBe(true)
    })
  })

  describe('when the pathname is a route that should keep analytics enabled', () => {
    it.each([
      '/',
      '/events',
      '/events/new-event',
      '/blog',
      '/blog/news',
      '/help',
      '/create',
      '/discord',
      '/press',
      '/report',
      '/sign-in',
      '/invite/abc'
    ])('should return false for %s', pathname => {
      expect(isAnalyticsExemptPath(pathname)).toBe(false)
    })
  })

  describe('when the pathname is a substring of an exempt route but not an exact match', () => {
    it.each(['/brandy', '/terms-and-conditions', '/privacyzilla'])(
      'should return false for %s so deeper paths still load analytics',
      pathname => {
        expect(isAnalyticsExemptPath(pathname)).toBe(false)
      }
    )
  })

  describe('when the pathname is empty', () => {
    it('should return false', () => {
      expect(isAnalyticsExemptPath('')).toBe(false)
    })
  })
})
