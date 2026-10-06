import type { DropdownSection } from './navbarConfig'

/** A tracked navbar destination: what the warehouse receives for each click, minus the derived `action`. */
interface NavbarLink {
  section: DropdownSection | 'learn' | 'user_menu' | 'home'
  labelKey: string
  href: string
  element: 'tab' | 'item'
  menu: 'desktop' | 'mobile' | 'bar'
}

export type { NavbarLink }
