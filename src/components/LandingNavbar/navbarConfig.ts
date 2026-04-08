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
  explore: MenuSection
  shop: MenuSection
  create: MenuSection
  learn: MenuSection
}

const MENU_CONFIG: MenuConfig = {
  explore: {
    labelKey: 'component.landing.navbar.explore',
    url: 'https://decentraland.org/events'
  },
  shop: {
    labelKey: 'component.landing.navbar.shop',
    items: [
      { labelKey: 'component.landing.navbar.shop_all', url: 'https://decentraland.org/marketplace' },
      {
        labelKey: 'component.landing.navbar.wearables',
        url: 'https://decentraland.org/marketplace/browse?assetType=item&section=wearables&status=on_sale'
      },
      {
        labelKey: 'component.landing.navbar.emotes',
        url: 'https://decentraland.org/marketplace/browse?assetType=item&section=emotes&status=on_sale'
      },
      { labelKey: 'component.landing.navbar.names', url: 'https://decentraland.org/marketplace/names/claim' },
      { labelKey: 'component.landing.navbar.land', url: 'https://decentraland.org/marketplace/lands' },
      { labelKey: 'component.landing.navbar.merch', url: 'https://store.decentraland.org/', isExternal: true }
    ]
  },
  create: {
    labelKey: 'component.landing.navbar.create',
    items: [
      { labelKey: 'component.landing.navbar.create_in_decentraland', url: 'https://decentraland.org/create/' },
      { labelKey: 'component.landing.navbar.publish_wearables_emotes', url: 'https://decentraland.org/builder/collections' },
      { labelKey: 'component.landing.navbar.publish_land', url: 'https://decentraland.org/builder/land' }
    ]
  },
  learn: {
    labelKey: 'component.landing.navbar.learn',
    items: [
      { labelKey: 'component.landing.navbar.get_started', url: 'https://docs.decentraland.org/player/', isExternal: true },
      { labelKey: 'component.landing.navbar.start_creating', url: 'https://docs.decentraland.org/creator/', isExternal: true },
      { labelKey: 'component.landing.navbar.see_whats_new', url: 'https://decentraland.org/blog/' }
    ]
  }
}

const USER_MENU_ITEMS = [
  { labelKey: 'component.landing.navbar.view_profile', url: 'https://decentraland.org/profile' },
  { labelKey: 'component.landing.navbar.my_assets', url: 'https://decentraland.org/marketplace/account' },
  { labelKey: 'component.landing.navbar.account_settings', url: 'https://decentraland.org/account' },
  { labelKey: 'component.landing.navbar.marketplace_authorizations', url: 'https://decentraland.org/marketplace/settings' }
] as const

const DROPDOWN_SECTIONS = ['shop', 'create', 'learn'] as const
type DropdownSection = (typeof DROPDOWN_SECTIONS)[number]

export { DROPDOWN_SECTIONS, MENU_CONFIG, USER_MENU_ITEMS }
export type { DropdownSection, MenuConfig, MenuItem, MenuSection }
