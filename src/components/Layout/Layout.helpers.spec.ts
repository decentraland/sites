import { isPageTrackingExempt } from './Layout.helpers'

describe('isPageTrackingExempt', () => {
  describe('when pathname is the landing or a regular page', () => {
    it.each(['/', '/download', '/whats-on', '/whats-on/new-hangout', '/help'])('should return false for %s', pathname => {
      expect(isPageTrackingExempt(pathname)).toBe(false)
    })
  })

  describe('when pathname is a blog route', () => {
    it.each(['/blog', '/blog/preview', '/blog/some-category', '/blog/some-category/some-post'])(
      'should return true for %s so the page owns its page() call after the async title resolves',
      pathname => {
        expect(isPageTrackingExempt(pathname)).toBe(true)
      }
    )
  })

  describe('when pathname is a legacy events redirect route', () => {
    it.each(['/events', '/events/event', '/events/listing', '/events/event?id=ev-1'])(
      'should return true for %s — the page() would surface the in-transit URL as a real visit',
      pathname => {
        expect(isPageTrackingExempt(pathname)).toBe(true)
      }
    )
  })

  describe('when pathname is a legacy places redirect route', () => {
    it.each(['/places', '/places/place', '/places/world', '/places/explore'])(
      'should return true for %s — the page() would surface the in-transit URL as a real visit',
      pathname => {
        expect(isPageTrackingExempt(pathname)).toBe(true)
      }
    )
  })

  describe('when pathname matches the legacy prefixes but as a substring', () => {
    it.each(['/eventsy', '/places-foo', '/whats-on/events'])('should return false for %s', pathname => {
      expect(isPageTrackingExempt(pathname)).toBe(false)
    })
  })
})
