import type { NotificationLocale } from 'decentraland-ui2'
import { MENU_CONFIG } from './navbarConfig'
import type { DropdownSection } from './navbarConfig'

// decentraland-ui2 ships notification copy in these three languages only
// (`NotificationLocale`), while the site offers six. Indexing its dictionaries
// with anything else returns undefined and the renderer reads `.title` off it,
// which took the whole navbar down for Japanese visitors (SITES-2S0).
const NOTIFICATION_LOCALES: ReadonlyArray<NotificationLocale> = ['en', 'es', 'zh']

/**
 * Narrows a site locale to one decentraland-ui2 can render notifications in,
 * falling back to English. Callers must funnel every locale through here before
 * handing it to a ui2 notification component: TypeScript cannot catch a bad
 * value at the call site, because the component map is loaded dynamically and
 * arrives untyped.
 */
function toNotificationLocale(locale: string): NotificationLocale {
  return NOTIFICATION_LOCALES.find(supported => supported === locale) ?? 'en'
}

/**
 * Whether a navbar section owns the page currently being viewed, so its tab can
 * be highlighted. Derived from MENU_CONFIG rather than a hardcoded route list,
 * so adding a destination to a dropdown lights the parent up for free.
 *
 * A section matches on its own url and on any of its items' urls, and matches
 * nested paths too — /places/place/-102,129 still belongs to Discover.
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

export { isSectionActive, toNotificationLocale }
