type NavbarClickLink = {
  section: string
  href: string
}

type NavbarClickOptions = {
  // Whether the click replaces the current page. Before analytics is ready, such a click goes out by beacon.
  leavesPage?: boolean
}

export type { NavbarClickLink, NavbarClickOptions }
