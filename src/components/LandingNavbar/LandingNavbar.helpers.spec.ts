import { isSectionActive, toNotificationLocale } from './LandingNavbar.helpers'

describe('when deciding which navbar section owns the current page', () => {
  it('should light up Discover on the What is On calendar', () => {
    expect(isSectionActive('discover', '/events')).toBe(true)
  })

  it('should light up Discover on the places feed', () => {
    expect(isSectionActive('discover', '/places')).toBe(true)
  })

  // /places/place/-102,129 and /events/new-event are still the same section.
  it('should light up Discover on a nested page of either destination', () => {
    expect(isSectionActive('discover', '/places/place/-102,129')).toBe(true)
    expect(isSectionActive('discover', '/events/new-event')).toBe(true)
  })

  it('should not light up Discover on the landing page', () => {
    expect(isSectionActive('discover', '/')).toBe(false)
  })

  // A prefix that is not a path boundary belongs to a different route.
  it('should not treat a longer sibling path as a nested page', () => {
    expect(isSectionActive('discover', '/discoverable')).toBe(false)
  })

  it('should not light up Discover on an unrelated route', () => {
    expect(isSectionActive('discover', '/account/wallets')).toBe(false)
  })

  // Shop and Create point at absolute decentraland.org URLs, so no in-app path
  // can ever match them — a bare pathname must not accidentally light them up.
  it('should never light up the sections whose destinations are external', () => {
    for (const pathname of ['/', '/shop', '/create', '/events']) {
      expect(isSectionActive('shop', pathname)).toBe(false)
      expect(isSectionActive('create', pathname)).toBe(false)
    }
  })
})

describe('when narrowing a site locale for ui2 notifications', () => {
  it.each(['en', 'es', 'zh'])('should keep %s, which ui2 ships copy for', locale => {
    expect(toNotificationLocale(locale)).toBe(locale)
  })

  // These are the ones that crashed the navbar: ui2 has no dictionary entry, so the
  // renderer read `.title` off undefined (SITES-2S0).
  it.each(['ja', 'ko', 'fr'])('should fall back to english for %s', locale => {
    expect(toNotificationLocale(locale)).toBe('en')
  })

  it.each([
    ['an unknown code', 'pt'],
    ['an empty string', ''],
    ['a regional variant', 'es-AR']
  ])('should fall back to english for %s', (_label, locale) => {
    expect(toNotificationLocale(locale)).toBe('en')
  })
})
