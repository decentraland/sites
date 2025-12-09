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

export type { CMSQueryParams, ContentfulAsset, ContentfulEntry, ContentfulLink, ContentfulListItem, ContentfulListResponse, ContentfulSys }
