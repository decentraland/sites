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

// NOTE (2026-08-04): the `discover` entry was removed from this config, which
// is what fed both the desktop tab and the mobile menu link, so `/discover`
// stops surfacing in the navbar before the section is announced. The routes,
// the pages and the `vercel.json` COOP/COEP headers stay in place: the path
// still resolves for anyone who types it, it is simply not advertised. The
// `component.landing.navbar.discover` label is deliberately kept in the six
// locale files so restoring this is a single revert with no i18n follow-up.
// To bring it back only outside production, gate the entry on
// `getEnv() !== Env.PRODUCTION` rather than restoring it unconditionally.
type MenuConfig = {
  whatsOn: MenuSection
  shop: MenuSection
  create: MenuSection
  learn: MenuSection
}

const MENU_CONFIG: MenuConfig = {
  whatsOn: {
    labelKey: 'component.landing.navbar.whats_on',
    url: '/whats-on'
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

const DROPDOWN_SECTIONS = ['shop', 'create'] as const
type DropdownSection = (typeof DROPDOWN_SECTIONS)[number]

export { DROPDOWN_SECTIONS, MENU_CONFIG, USER_MENU_ITEMS }
export type { DropdownSection, MenuConfig, MenuItem, MenuSection }
