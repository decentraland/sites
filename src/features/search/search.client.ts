import { cmsClient, getCmsBaseUrl } from '../../services/blogClient'
import { resolveAssetUrl, resolveEntrySlug } from '../blog/blog.helpers'
import type {
  CMSSearchItem,
  CMSSearchResponse,
  EnrichedSearchPost,
  SearchBlogPostsParams,
  SearchBlogPostsResponse,
  SearchBlogResult,
  SearchPostFields
} from './search.types'

// cms-server full-text search supports en-US, es and zh. Landing currently serves English only.
const SEARCH_LOCALE = 'en-US'

// Resolves asset URL + category slug in parallel. Both helpers cache at module level,
// so popular categories/images collapse to a single CMS fetch across the whole session.
const enrichHit = async (hit: CMSSearchItem): Promise<EnrichedSearchPost> => {
  const fields = hit.fields as SearchPostFields
  const slug = fields.id || hit.sys.id
  const assetId = fields.image?.sys?.id || ''
  const categoryEntryId = fields.category?.sys?.id || ''
  const plainTitle = fields.title || ''
  const plainDescription = fields.description || ''

  const [imageUrl, categorySlug] = await Promise.all([resolveAssetUrl(assetId), resolveEntrySlug(categoryEntryId)])

  return {
    id: slug,
    categorySlug,
    imageUrl,
    title: plainTitle,
    description: plainDescription,
    highlightedTitle: hit._highlight?.title ?? plainTitle,
    highlightedDescription: hit._highlight?.description ?? plainDescription
  }
}

const searchClient = cmsClient.injectEndpoints({
  endpoints: build => ({
    searchBlogPosts: build.query<SearchBlogPostsResponse, SearchBlogPostsParams>({
      query: ({ query, hitsPerPage = 10, page = 0 }) => ({
        url: getCmsBaseUrl() + '/blog/posts',
        params: {
          q: query,
          locale: SEARCH_LOCALE,
          limit: hitsPerPage,
          skip: page * hitsPerPage
        }
      }),
      transformResponse: async (response: CMSSearchResponse, _meta, { hitsPerPage = 10, page = 0 }): Promise<SearchBlogPostsResponse> => {
        const enriched = await Promise.all(response.items.map(enrichHit))
        const results = enriched.map(hit => ({
          url: `/blog/${hit.categorySlug}/${hit.id}`,
          image: hit.imageUrl,
          title: hit.highlightedTitle,
          description: hit.highlightedDescription
        }))
        return {
          results,
          total: response.total,
          hasMore: (page + 1) * hitsPerPage < response.total
        }
      },
      providesTags: (_result, _error, arg) => [{ type: 'SearchResults', id: arg.query }]
    }),
    searchBlog: build.query<SearchBlogResult[], SearchBlogPostsParams>({
      query: ({ query, hitsPerPage = 10, page = 0 }) => ({
        url: getCmsBaseUrl() + '/blog/posts',
        params: {
          q: query,
          locale: SEARCH_LOCALE,
          limit: hitsPerPage,
          skip: page * hitsPerPage
        }
      }),
      transformResponse: async (response: CMSSearchResponse): Promise<SearchBlogResult[]> => {
        const enriched = await Promise.all(response.items.map(enrichHit))
        return enriched.map(hit => ({
          id: hit.id,
          categoryId: hit.categorySlug,
          url: `/blog/${hit.categorySlug}/${hit.id}`,
          image: hit.imageUrl,
          highlightedTitle: hit.highlightedTitle,
          highlightedDescription: hit.highlightedDescription
        }))
      },
      providesTags: (_result, _error, arg) => [{ type: 'SearchResults', id: arg.query }]
    })
  }),
  overrideExisting: false
})

const { useSearchBlogPostsQuery, useSearchBlogQuery } = searchClient

export { searchClient, useSearchBlogPostsQuery, useSearchBlogQuery }
