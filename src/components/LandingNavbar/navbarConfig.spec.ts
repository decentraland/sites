import { DROPDOWN_SECTIONS, MENU_CONFIG, USER_MENU_ITEMS } from './navbarConfig'

const allUrls = (): (string | undefined)[] => [
  ...Object.values(MENU_CONFIG).flatMap(section => [section.url, ...(section.items?.map(item => item.url) ?? [])]),
  ...USER_MENU_ITEMS.map(item => item.url)
]

describe('when reading the navbar menu config', () => {
  // The `/discover` section ships behind an unadvertised URL until it is
  // announced. Both the desktop tab list and the mobile menu render straight
  // from this config, so asserting here covers both surfaces at once and stops
  // the entry from silently coming back.
  it('should not expose any /discover entry', () => {
    const discoverUrls = allUrls().filter((url): url is string => typeof url === 'string' && url.includes('/discover'))

    expect(discoverUrls).toEqual([])
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
