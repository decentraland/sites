interface ContentfulSys {
  id: string
  type: string
  linkType?: string
}

interface ContentfulLink {
  sys: ContentfulSys
}

interface ContentfulEntry {
  sys: ContentfulSys
  fields: Record<string, unknown>
}

interface ContentfulListItem {
  sys: ContentfulSys
}

interface ContentfulListResponse {
  items: ContentfulListItem[]
  total: number
}

type CMSQueryParams = Record<string, string | number | boolean | undefined>

interface ContentfulAsset {
  url: string
  mimeType: string
  width: number
  height: number
}

enum ContentfulEntryKey {
  LANDING_HERO = 'CONTENTFUL_LANDING_HERO_MAIN_ID',
  LANDING_MISSIONS = 'CONTENTFUL_LANDING_MISSIONS_V2_ID',
  LANDING_FAQ = 'CONTENTFUL_LANDING_FAQ_ID',
  LANDING_CREATE_AVATAR_BANNER = 'CONTENTFUL_LANDING_CREATE_AVATAR_ID',
  LANDING_START_EXPLORING_BANNER = 'CONTENTFUL_LANDING_START_EXPLORING_ID',
  LANDING_WHATS_HOT = 'CONTENTFUL_LANDING_WHATS_HOT_ID',
  LANDING_TEXT_MARQUEE = 'CONTENTFUL_LANDING_MARQUEE_ID',
  LANDING_SOCIAL_PROOF = 'CONTENTFUL_LANDING_SOCIAL_PROOF_ID',
  LANDING_INVITE_HERO = 'CONTENTFUL_LANDING_INVITE_HERO_ID',
  LANDING_INVITE_SECOND_HERO = 'CONTENTFUL_LANDING_INVITE_SECOND_HERO_ID',
  LANDING_SUPPORT_FAQ = 'CONTENTFUL_LANDING_SUPPORT_FAQ_ID',
  CREATORS_HERO = 'CONTENTFUL_LANDING_CREATORS_HERO_ID',
  CREATORS_WHY = 'CONTENTFUL_LANDING_CREATORS_WHY_ID',
  CREATORS_CREATE = 'CONTENTFUL_LANDING_CREATORS_CREATE_ID',
  CREATORS_CONNECT = 'CONTENTFUL_LANDING_CREATORS_CONNECT_ID',
  CREATORS_LEARN = 'CONTENTFUL_LANDING_CREATORS_LEARN_ID',
  CREATORS_FAQ = 'CONTENTFUL_LANDING_CREATORS_FAQ_ID'
}

export { ContentfulEntryKey }
export type { CMSQueryParams, ContentfulAsset, ContentfulEntry, ContentfulLink, ContentfulListItem, ContentfulListResponse, ContentfulSys }
