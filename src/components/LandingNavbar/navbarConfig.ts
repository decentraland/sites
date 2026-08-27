type MenuItem = {
  labelKey: string
  url: string
  isExternal?: boolean
}

type MenuSection = {
  labelKey: string
  url?: string
  items?: MenuItem[]
}

type MenuConfig = {
  discover: MenuSection
  shop: MenuSection
  create: MenuSection
  learn: MenuSection
}

const MENU_CONFIG: MenuConfig = {
  // Single entry point for both destination feeds: "Events" is the What's On
  // calendar, "Places" is the /places explore section. They used to sit at
  // opposite ends of the tab list (Explore first, Discover last).
  discover: {
    labelKey: 'component.landing.navbar.discover',
    items: [
      { labelKey: 'component.landing.navbar.events', url: '/events' },
      { labelKey: 'component.landing.navbar.places', url: '/places' }
    ]
  },
  shop: {
    labelKey: 'component.landing.navbar.shop',
    items: [
      { labelKey: 'component.landing.navbar.shop_all', url: 'https://decentraland.org/shop' },
      {
        labelKey: 'component.landing.navbar.wearables',
        url: 'https://decentraland.org/shop/items?category=wearable'
      },
      {
        labelKey: 'component.landing.navbar.emotes',
        url: 'https://decentraland.org/shop/items?category=emote'
      },
      { labelKey: 'component.landing.navbar.names', url: 'https://decentraland.org/shop/items?category=names' },
      // LAND has no category in the shop, so it stays on the marketplace.
      { labelKey: 'component.landing.navbar.land', url: 'https://decentraland.org/marketplace/lands' },
      { labelKey: 'component.landing.navbar.merch', url: 'https://store.decentraland.org/', isExternal: true }
    ]
  },
  create: {
    labelKey: 'component.landing.navbar.create',
    items: [
      { labelKey: 'component.landing.navbar.create_in_decentraland', url: 'https://decentraland.org/create/' },
      { labelKey: 'component.landing.navbar.publish_wearables_emotes', url: 'https://decentraland.org/builder/collections' },
      { labelKey: 'component.landing.navbar.publish_land', url: 'https://decentraland.org/builder/land' },
      {
        labelKey: 'component.landing.navbar.creator_documentation',
        url: 'https://docs.decentraland.org/creator',
        isExternal: true
      }
    ]
  },
  learn: {
    labelKey: 'component.landing.navbar.learn',
    url: 'https://decentraland.org/blog/'
  }
}

const USER_MENU_ITEMS = [
  { labelKey: 'component.landing.navbar.view_profile', url: 'https://decentraland.org/profile' },
  { labelKey: 'component.landing.navbar.my_assets', url: 'https://decentraland.org/marketplace/account' },
  { labelKey: 'component.landing.navbar.account_settings', url: 'https://decentraland.org/account' },
  { labelKey: 'component.landing.navbar.marketplace_authorizations', url: 'https://decentraland.org/marketplace/settings' }
] as const

const DROPDOWN_SECTIONS = ['discover', 'shop', 'create'] as const
type DropdownSection = (typeof DROPDOWN_SECTIONS)[number]

export { DROPDOWN_SECTIONS, MENU_CONFIG, USER_MENU_ITEMS }
export type { DropdownSection, MenuConfig, MenuItem, MenuSection }
