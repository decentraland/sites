import { isSameTabNavigation, isSectionActive, toNavbarAction, toNotificationLocale } from './LandingNavbar.helpers'

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

describe('when naming the analytics action for a navbar link', () => {
  it('should use the last segment of its i18n key', () => {
    expect(toNavbarAction('component.landing.navbar.creator_documentation')).toBe('creator_documentation')
  })

  it('should return a key without dots unchanged', () => {
    expect(toNavbarAction('learn')).toBe('learn')
  })
})

describe('when deciding whether a navbar click replaces the current page', () => {
  const linkWith = (target?: string) => {
    const link = document.createElement('a')
    if (target) link.setAttribute('target', target)
    return link
  }
  const click = (currentTarget: Element, keys: Partial<Record<'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey', boolean>> = {}) => ({
    currentTarget,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...keys
  })

  it('should treat a plain click on a same-tab link as leaving the page', () => {
    expect(isSameTabNavigation(click(linkWith()))).toBe(true)
  })

  it('should keep the page for a link that opens in a new tab', () => {
    expect(isSameTabNavigation(click(linkWith('_blank')))).toBe(false)
  })

  it.each(['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const)('should keep the page when %s opens the link elsewhere', key => {
    expect(isSameTabNavigation(click(linkWith(), { [key]: true }))).toBe(false)
  })
})
