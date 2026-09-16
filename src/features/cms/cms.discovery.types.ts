interface CMSEntryLink {
  sys: {
    id: string
    type: string
    linkType?: string
  }
}

interface CMSPostItem {
  sys: { id: string }
  fields: {
    id: string
    title: string
    description?: string
    publishedDate?: string
    image?: CMSEntryLink
    category?: CMSEntryLink
  }
}

interface CMSPostsResponse {
  items: CMSPostItem[]
  total: number
}

interface CMSCategoryItem {
  sys: { id: string }
  fields: {
    id: string
    title: string
  }
}

interface CMSCategoriesResponse {
  items: CMSCategoryItem[]
}

interface CMSAssetResponse {
  fields: {
    file: {
      url: string
    }
  }
}

interface LatestPost {
  id: string
  title: string
  publishedDate: string | null
  categoryTitle: string | null
  imageUrl: string | null
  url: string
}

export type { CMSAssetResponse, CMSCategoriesResponse, CMSCategoryItem, CMSEntryLink, CMSPostItem, CMSPostsResponse, LatestPost }
