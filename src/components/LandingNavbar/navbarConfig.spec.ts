import { DROPDOWN_SECTIONS, MENU_CONFIG, USER_MENU_ITEMS } from './navbarConfig'

const allUrls = (): (string | undefined)[] => [
  ...Object.values(MENU_CONFIG).flatMap(section => [section.url, ...(section.items?.map(item => item.url) ?? [])]),
  ...USER_MENU_ITEMS.map(item => item.url)
]

describe('when reading the navbar menu config', () => {
  // Events (What's On) and Places (/places) used to be two separate tabs at
  // opposite ends of the list. They now live in a single leading "Discover"
  // dropdown. Both the desktop tab list and the mobile menu render straight
  // from this config, so asserting here covers both surfaces.
  it('should expose both destination feeds inside the Discover dropdown', () => {
    expect(MENU_CONFIG.discover.labelKey).toBe('component.landing.navbar.discover')
    expect(MENU_CONFIG.discover.items).toEqual([
      { labelKey: 'component.landing.navbar.events', url: '/events' },
      { labelKey: 'component.landing.navbar.places', url: '/places' }
    ])
  })

  // The dropdown parent navigates to its first item on click, so Discover
  // landing on the What's On calendar depends on the ordering above.
  it('should lead the tab list with the Discover dropdown', () => {
    expect(DROPDOWN_SECTIONS[0]).toBe('discover')
  })

  it('should keep every entry pointing at a non-empty url', () => {
    for (const url of allUrls()) {
      expect(url === undefined || url.length > 0).toBe(true)
    }
  })

  it('should only declare dropdown sections that exist in the config', () => {
    for (const section of DROPDOWN_SECTIONS) {
      expect(MENU_CONFIG[section].items?.length).toBeGreaterThan(0)
    }
  })
})
