import { Document } from '@contentful/rich-text-types'

interface ContentfulAsset {
  id: string
  url: string
  width: number
  height: number
  mimeType: string
}

interface BlogCategory {
  id: string
  slug: string
  title: string
  description: string
  image: ContentfulAsset
  isShownInMenu: boolean
  url: string
}

interface BlogAuthor {
  id: string
  slug: string
  title: string
  description: string
  image: ContentfulAsset
  url: string
}

interface BlogPost {
  id: string
  slug: string
  title: string
  description: string
  publishedDate: string
  body: Document
  bodyAssets: Record<string, ContentfulAsset>
  image: ContentfulAsset
  category: BlogCategory
  author: BlogAuthor
  url: string
}

interface PaginatedBlogPosts {
  posts: BlogPost[]
  total: number
  hasMore: boolean
  nextCmsSkip: number // Track CMS-level skip for proper pagination with client-side filtering
}

// Placeholder for loading state in lists
interface PlaceholderPost {
  id: string
  isPlaceholder: true
}

type PostOrPlaceholder = BlogPost | PlaceholderPost

/**
 * Search hit shape consumed by the results page and the autocomplete card. The
 * `highlighted*` fields may carry `<em>`-wrapped HTML from the cms-server `ts_headline`
 * — render sites MUST pass them through `sanitizeHighlight` (DOMPurify, allowlist
 * `['em','mark']`) before injection.
 */
interface SearchResult {
  url: string
  image: string
  highlightedTitle: string
  highlightedDescription: string
}

export type { BlogAuthor, BlogCategory, BlogPost, ContentfulAsset, PaginatedBlogPosts, PlaceholderPost, PostOrPlaceholder, SearchResult }
