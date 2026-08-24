import { isSectionActive } from './LandingNavbar.helpers'

describe('when deciding which navbar section owns the current page', () => {
  it('should light up Discover on the What is On calendar', () => {
    expect(isSectionActive('discover', '/whats-on')).toBe(true)
  })

  it('should light up Discover on the places feed', () => {
    expect(isSectionActive('discover', '/discover')).toBe(true)
  })

  // /discover/place/-102,129 and /whats-on/new-hangout are still the same section.
  it('should light up Discover on a nested page of either destination', () => {
    expect(isSectionActive('discover', '/discover/place/-102,129')).toBe(true)
    expect(isSectionActive('discover', '/whats-on/new-hangout')).toBe(true)
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
    for (const pathname of ['/', '/shop', '/create', '/whats-on']) {
      expect(isSectionActive('shop', pathname)).toBe(false)
      expect(isSectionActive('create', pathname)).toBe(false)
    }
  })
})
