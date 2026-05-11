import { cmsClient, getCmsBaseUrl } from '../../services/cmsClient'
import { resolveAssetUrl, resolveEntrySlug } from './cms.helpers'
import type { CMSSearchItem, CMSSearchResponse, SearchBlogPostsParams, SearchBlogPostsResponse, SearchBlogResult } from './cms.search.types'

/**
 * Intermediate shape after resolving asset URL + category slug; internal to this module.
 * `highlightedTitle`/`highlightedDescription` may contain `<em>` markup — consumers of
 * the exported endpoints always sanitize before rendering.
 */
interface EnrichedSearchPost {
  id: string
  categorySlug: string
  imageUrl: string
  highlightedTitle: string
  highlightedDescription: string
}

// cms-server full-text search supports en-US, es and zh. Landing currently serves English only.
const SEARCH_LOCALE = 'en-US'

// Queries shorter than this short-circuit to an empty result without hitting the network.
// Matches the previous Algolia client behavior and keeps single-char keystrokes from firing
// full-text scans while the user is still typing.
const MIN_QUERY_LENGTH = 3

// Shared query builder — both search endpoints hit the same cms-server endpoint with
// identical params; only their response shape differs, so keep the URL construction
// in one place.
const buildSearchQuery = ({ query, hitsPerPage = 10, page = 0 }: SearchBlogPostsParams) => ({
  url: getCmsBaseUrl() + '/blog/posts',
  params: {
    q: query,
    locale: SEARCH_LOCALE,
    limit: hitsPerPage,
    skip: page * hitsPerPage
  }
})

const isSearchResponse = (value: unknown): value is CMSSearchResponse =>
  typeof value === 'object' && value !== null && Array.isArray((value as CMSSearchResponse).items)

// Resolves asset URL + category slug in parallel. Both helpers cache at module level,
// so popular categories/images collapse to a single CMS fetch across the whole session.
const enrichHit = async (hit: CMSSearchItem): Promise<EnrichedSearchPost> => {
  const { fields } = hit
  const slug = fields.id ?? hit.sys.id
  const assetId = fields.image?.sys?.id ?? ''
  const categoryEntryId = fields.category?.sys?.id ?? ''
  const plainTitle = fields.title ?? ''
  const plainDescription = fields.description ?? ''

  const [imageUrl, categorySlug] = await Promise.all([resolveAssetUrl(assetId), resolveEntrySlug(categoryEntryId)])

  return {
    id: slug,
    categorySlug,
    imageUrl,
    highlightedTitle: hit._highlight?.title ?? plainTitle,
    highlightedDescription: hit._highlight?.description ?? plainDescription
  }
}

const searchEndpoints = cmsClient.injectEndpoints({
  endpoints: build => ({
    searchBlogPosts: build.query<SearchBlogPostsResponse, SearchBlogPostsParams>({
      queryFn: async (args, _api, _extra, baseQuery) => {
        if (args.query.trim().length < MIN_QUERY_LENGTH) {
          return { data: { results: [], total: 0, hasMore: false } }
        }
        const result = await baseQuery(buildSearchQuery(args))
        if (result.error) return { error: result.error }
        if (!isSearchResponse(result.data)) {
          return { error: { status: 'CUSTOM_ERROR', error: 'Unexpected search response shape' } }
        }
        const { hitsPerPage = 10, page = 0 } = args
        const enriched = await Promise.all(result.data.items.map(enrichHit))
        const results = enriched.map(hit => ({
          url: `/blog/${hit.categorySlug}/${hit.id}`,
          image: hit.imageUrl,
          highlightedTitle: hit.highlightedTitle,
          highlightedDescription: hit.highlightedDescription
        }))
        return {
          data: {
            results,
            total: result.data.total,
            hasMore: (page + 1) * hitsPerPage < result.data.total
          }
        }
      },
      providesTags: (_result, _error, arg) => [{ type: 'SearchResults', id: arg.query }]
    }),
    searchBlog: build.query<SearchBlogResult[], SearchBlogPostsParams>({
      queryFn: async (args, _api, _extra, baseQuery) => {
        if (args.query.trim().length < MIN_QUERY_LENGTH) {
          return { data: [] }
        }
        const result = await baseQuery(buildSearchQuery(args))
        if (result.error) return { error: result.error }
        if (!isSearchResponse(result.data)) {
          return { error: { status: 'CUSTOM_ERROR', error: 'Unexpected search response shape' } }
        }
        const enriched = await Promise.all(result.data.items.map(enrichHit))
        const data = enriched.map(hit => ({
          id: hit.id,
          categorySlug: hit.categorySlug,
          url: `/blog/${hit.categorySlug}/${hit.id}`,
          image: hit.imageUrl,
          highlightedTitle: hit.highlightedTitle,
          highlightedDescription: hit.highlightedDescription
        }))
        return { data }
      },
      providesTags: (_result, _error, arg) => [{ type: 'SearchResults', id: arg.query }]
    })
  }),
  overrideExisting: false
})

const { useSearchBlogPostsQuery, useSearchBlogQuery } = searchEndpoints

export { searchEndpoints, useSearchBlogPostsQuery, useSearchBlogQuery }
