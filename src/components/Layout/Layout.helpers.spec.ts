import { isPageTrackingExempt } from './Layout.helpers'

describe('isPageTrackingExempt', () => {
  describe('when pathname is the landing or a regular page', () => {
    it.each(['/', '/download', '/events', '/events/new-hangout', '/help'])('should return false for %s', pathname => {
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

  // /events and /places are the renamed prefixes: they exist only to redirect into /events and
  // /places now, so a page() there would surface an in-transit URL as a real visit.
  describe('when pathname is a renamed-section redirect route', () => {
    it.each(['/whats-on', '/whats-on/new-hangout', '/whats-on/admin/users', '/discover', '/discover/place/1,2'])(
      'should return true for %s — the page() would surface the in-transit URL as a real visit',
      pathname => {
        expect(isPageTrackingExempt(pathname)).toBe(true)
      }
    )
  })

  // The standalone events site deep-linked through /events/event?id=, which now sits under the
  // canonical Events prefix but is still redirect-only.
  describe('when pathname is the standalone-site event deep link', () => {
    it('should return true for /events/event', () => {
      expect(isPageTrackingExempt('/events/event')).toBe(true)
    })
  })

  describe('when pathname is a Places route', () => {
    it.each(['/places', '/places/communities', '/places/place/1,2', '/places/world/foo'])(
      'should return true for %s so the page owns its page() call',
      pathname => {
        expect(isPageTrackingExempt(pathname)).toBe(true)
      }
    )
  })

  describe('when pathname matches the legacy prefixes but as a substring', () => {
    it.each(['/eventsy', '/places-foo', '/events/events'])('should return false for %s', pathname => {
      expect(isPageTrackingExempt(pathname)).toBe(false)
    })
  })
})
