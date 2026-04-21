/**
 * @jest-environment node
 */
import { configureStore } from '@reduxjs/toolkit'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { cmsClient } from '../../services/blogClient'
import { searchClient } from './search.client'
import type { CMSSearchResponse } from './search.types'

// `services/blogClient.ts` uses `import.meta.env.DEV`, which ts-jest can't parse in CJS mode.
// Swap the whole module for a minimal stand-in so the spec can exercise the real injectEndpoints flow.
jest.mock('../../services/blogClient', () => {
  const mockCmsClient = createApi({
    reducerPath: 'cmsClient',
    baseQuery: fetchBaseQuery({ baseUrl: '' }),
    tagTypes: ['BlogPosts', 'BlogPost', 'Categories', 'Authors', 'SearchResults'],
    endpoints: () => ({})
  })
  return {
    cmsClient: mockCmsClient,
    cmsBaseUrl: 'https://cms.test',
    getCmsBaseUrl: () => 'https://cms.test'
  }
})

jest.mock('../blog/blog.helpers', () => ({
  resolveAssetUrl: jest.fn(),
  resolveEntrySlug: jest.fn()
}))

const { resolveAssetUrl: mockResolveAssetUrl, resolveEntrySlug: mockResolveEntrySlug } = jest.requireMock('../blog/blog.helpers')

function createTestStore() {
  return configureStore({
    reducer: {
      [cmsClient.reducerPath]: cmsClient.reducer
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(cmsClient.middleware)
  })
}

function buildResponse(overrides: Partial<CMSSearchResponse> = {}): CMSSearchResponse {
  return {
    items: [
      {
        sys: { id: 'entry-1', type: 'Entry' },
        fields: {
          id: 'my-post',
          title: 'Plain Title',
          description: 'Plain Description',
          image: { sys: { id: 'asset-1' } },
          category: { sys: { id: 'cat-1' } }
        },
        _rank: 0.42,
        _highlight: {
          title: '<em>Plain</em> Title',
          description: '<em>Plain</em> Description'
        }
      }
    ],
    total: 1,
    skip: 0,
    limit: 10,
    ...overrides
  }
}

describe('searchClient', () => {
  const mockFetch = jest.fn()
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = mockFetch as typeof global.fetch
    mockResolveAssetUrl.mockResolvedValue('https://cdn.test/asset-1.jpg')
    mockResolveEntrySlug.mockResolvedValue('announcements')
  })

  afterEach(() => {
    jest.resetAllMocks()
    global.fetch = originalFetch
  })

  const jsonResponse = (body: unknown) =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })

  describe('when searchBlogPosts is called', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(jsonResponse(buildResponse()))
    })

    it('should build a /blog/posts URL with q, locale, limit and skip params', async () => {
      const store = createTestStore()
      await store.dispatch(searchClient.endpoints.searchBlogPosts.initiate({ query: 'plain', hitsPerPage: 10, page: 2 }))

      const fetchedUrl = mockFetch.mock.calls[0][0] as Request | string
      const urlString = typeof fetchedUrl === 'string' ? fetchedUrl : fetchedUrl.url

      expect(urlString).toContain('/blog/posts')
      expect(urlString).toContain('q=plain')
      expect(urlString).toContain('locale=en-US')
      expect(urlString).toContain('limit=10')
      expect(urlString).toContain('skip=20')
    })

    it('should map items to SearchResult with highlight markup preserved', async () => {
      const store = createTestStore()
      const result = await store.dispatch(searchClient.endpoints.searchBlogPosts.initiate({ query: 'plain', hitsPerPage: 10, page: 0 }))

      expect(result.data).toEqual({
        results: [
          {
            url: '/blog/announcements/my-post',
            image: 'https://cdn.test/asset-1.jpg',
            title: '<em>Plain</em> Title',
            description: '<em>Plain</em> Description'
          }
        ],
        total: 1,
        hasMore: false
      })
    })

    it('should compute hasMore from the current page and total', async () => {
      mockFetch.mockResolvedValue(jsonResponse(buildResponse({ total: 42 })))
      const store = createTestStore()
      const result = await store.dispatch(searchClient.endpoints.searchBlogPosts.initiate({ query: 'plain', hitsPerPage: 10, page: 0 }))

      expect(result.data?.hasMore).toBe(true)
    })

    it('should fall back to plain fields when _highlight is missing', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse(
          buildResponse({
            items: [
              {
                sys: { id: 'entry-2', type: 'Entry' },
                fields: {
                  id: 'post-2',
                  title: 'No Highlight Title',
                  description: 'No Highlight Description',
                  image: { sys: { id: 'asset-1' } },
                  category: { sys: { id: 'cat-1' } }
                }
              }
            ]
          })
        )
      )
      const store = createTestStore()
      const result = await store.dispatch(searchClient.endpoints.searchBlogPosts.initiate({ query: 'plain', hitsPerPage: 10, page: 0 }))

      expect(result.data?.results[0]).toMatchObject({
        title: 'No Highlight Title',
        description: 'No Highlight Description'
      })
    })
  })

  describe('when searchBlog is called', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(jsonResponse(buildResponse()))
    })

    it('should map items to SearchBlogResult with id, categoryId and URL', async () => {
      const store = createTestStore()
      const result = await store.dispatch(searchClient.endpoints.searchBlog.initiate({ query: 'plain', hitsPerPage: 5, page: 0 }))

      expect(result.data).toEqual([
        {
          id: 'my-post',
          categoryId: 'announcements',
          url: '/blog/announcements/my-post',
          image: 'https://cdn.test/asset-1.jpg',
          highlightedTitle: '<em>Plain</em> Title',
          highlightedDescription: '<em>Plain</em> Description'
        }
      ])
    })
  })
})
