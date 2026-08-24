import { MENU_CONFIG } from './navbarConfig'
import type { DropdownSection } from './navbarConfig'

/**
 * Whether a navbar section owns the page currently being viewed, so its tab can
 * be highlighted. Derived from MENU_CONFIG rather than a hardcoded route list,
 * so adding a destination to a dropdown lights the parent up for free.
 *
 * A section matches on its own url and on any of its items' urls, and matches
 * nested paths too — /discover/place/-102,129 still belongs to Discover.
 * External entries (the Shop and Create dropdowns point at absolute URLs) can
 * never be the current page, so only app-relative paths are considered.
 */
function isSectionActive(section: DropdownSection, pathname: string): boolean {
  const config = MENU_CONFIG[section]
  const destinations = [config.url, ...(config.items?.map(item => item.url) ?? [])]

  return destinations.some(url => {
    if (url === undefined || !url.startsWith('/')) return false
    return pathname === url || pathname.startsWith(`${url}/`)
  })
}

export { isSectionActive }
