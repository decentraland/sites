import type { CMSEntry } from '../blog/cms.types'

/**
 * `<em>`-wrapped snippets produced by the cms-server ts_headline when a search query is supplied.
 * Only populated fields (where the highlight actually matched) are present.
 */

interface CMSSearchHighlight {
  title?: string
  description?: string
  body?: string
}

/** Narrow view of the `fields` object we consume from a search hit. */
interface SearchPostFields {
  id?: string
  title?: string
  description?: string
  image?: { sys?: { id?: string } }
  category?: { sys?: { id?: string } }
}

/**
 * A post entry enriched with search metadata. `_rank` and `_highlight` are only set
 * on the response when the request included a non-empty `q` param. `fields` overrides
 * `CMSEntry.fields` with the narrow shape the search code actually consumes, so accesses
 * are type-checked without casts.
 */

interface CMSSearchItem extends Omit<CMSEntry, 'fields'> {
  fields: SearchPostFields
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _rank?: number
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _highlight?: CMSSearchHighlight
}

interface CMSSearchResponse {
  items: CMSSearchItem[]
  total: number
  skip: number
  limit: number
}

/** Intermediate shape after resolving asset URL + category slug; internal to search.client. */
interface EnrichedSearchPost {
  id: string
  categorySlug: string
  imageUrl: string
  title: string
  description: string
  highlightedTitle: string
  highlightedDescription: string
}

interface SearchBlogResult {
  id: string
  categoryId: string
  url: string
  image: string
  highlightedTitle: string
  highlightedDescription: string
}

interface SearchBlogPostsParams {
  query: string
  hitsPerPage?: number
  page?: number
}

interface SearchBlogPostsResponse {
  results: import('../../shared/blog/types/blog.domain').SearchResult[]
  total: number
  hasMore: boolean
}

export type {
  CMSSearchHighlight,
  CMSSearchItem,
  CMSSearchResponse,
  EnrichedSearchPost,
  SearchBlogPostsParams,
  SearchBlogPostsResponse,
  SearchBlogResult
}
