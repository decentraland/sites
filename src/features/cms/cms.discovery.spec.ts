import { act, renderHook } from '@testing-library/react'
import { useGetLatestBlogPostsQuery } from './cms.discovery'

const envMock = jest.fn<string | undefined, [string]>()
jest.mock('../../config/env', () => ({
  getEnv: (key: string) => envMock(key)
}))

const BASE_URL = 'https://cms.test/spaces/x/environments/master'

const postsPayload = {
  total: 1,
  items: [
    {
      sys: { id: 'post-1' },
      fields: {
        id: 'fresh-post',
        title: 'Fresh Post',
        publishedDate: '2026-06-15T11:00-07:00',
        image: { sys: { id: 'asset-1', type: 'Link', linkType: 'Asset' } },
        category: { sys: { id: 'cat-1', type: 'Link', linkType: 'Entry' } }
      }
    }
  ]
}

const categoriesPayload = {
  items: [{ sys: { id: 'cat-1' }, fields: { id: 'announcements', title: 'Announcements' } }]
}

const assetPayload = {
  fields: { file: { url: '//images.test/cover.png' } }
}

function okResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(payload)
  } as unknown as Response
}

async function flushAll() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('cms.discovery', () => {
  let fetchMock: jest.Mock<Promise<Response>, [RequestInfo | URL, RequestInit?]>

  beforeEach(() => {
    envMock.mockReset().mockImplementation((key: string) => (key === 'CMS_BASE_URL' ? BASE_URL : undefined))
    fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
    fetchMock.mockImplementation(url => {
      const target = String(url)
      if (target.includes('/blog/posts')) return Promise.resolve(okResponse(postsPayload))
      if (target.includes('/blog/categories')) return Promise.resolve(okResponse(categoriesPayload))
      if (target.includes('/assets/')) return Promise.resolve(okResponse(assetPayload))
      return Promise.resolve(okResponse(null))
    })
    global.fetch = fetchMock as unknown as typeof global.fetch
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when the CMS responds with posts, categories and assets', () => {
    it('should expose the mapped latest posts and stop loading', async () => {
      const { result, unmount } = renderHook(() => useGetLatestBlogPostsQuery())

      expect(result.current.isLoading).toBe(true)

      await flushAll()

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toEqual([
        {
          id: 'post-1',
          title: 'Fresh Post',
          publishedDate: '2026-06-15T11:00-07:00',
          categoryTitle: 'Announcements',
          imageUrl: 'https://images.test/cover.png',
          url: '/blog/announcements/fresh-post'
        }
      ])
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/blog/posts?limit=3`, expect.anything())
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/blog/categories`, expect.anything())
      expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/assets/asset-1`, expect.anything())
      unmount()
    })

    it('should fetch only once while consumers stay mounted', async () => {
      const first = renderHook(() => useGetLatestBlogPostsQuery())
      await flushAll()
      const postsCalls = fetchMock.mock.calls.filter(([url]) => String(url).includes('/blog/posts')).length

      const second = renderHook(() => useGetLatestBlogPostsQuery())
      await flushAll()

      expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/blog/posts')).length).toBe(postsCalls)
      first.unmount()
      second.unmount()
    })
  })

  describe('when CMS_BASE_URL is not configured', () => {
    beforeEach(() => {
      envMock.mockReturnValue(undefined)
    })

    it('should resolve to an empty list without fetching', async () => {
      const { result, unmount } = renderHook(() => useGetLatestBlogPostsQuery())

      await flushAll()

      expect(result.current).toEqual({ data: [], isLoading: false })
      expect(fetchMock).not.toHaveBeenCalled()
      unmount()
    })
  })

  describe('when the posts request fails', () => {
    beforeEach(() => {
      fetchMock.mockRejectedValue(new Error('network down'))
    })

    it('should resolve to an empty list', async () => {
      const { result, unmount } = renderHook(() => useGetLatestBlogPostsQuery())

      await flushAll()

      expect(result.current).toEqual({ data: [], isLoading: false })
      unmount()
    })
  })

  describe('when the posts request returns a non-ok response', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve(null) } as unknown as Response)
    })

    it('should resolve to an empty list', async () => {
      const { result, unmount } = renderHook(() => useGetLatestBlogPostsQuery())

      await flushAll()

      expect(result.current).toEqual({ data: [], isLoading: false })
      unmount()
    })
  })

  describe('when the CMS returns a malformed payload', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(okResponse({}))
    })

    it('should resolve to an empty list', async () => {
      const { result, unmount } = renderHook(() => useGetLatestBlogPostsQuery())

      await flushAll()

      expect(result.current).toEqual({ data: [], isLoading: false })
      unmount()
    })
  })

  describe('when an asset request fails', () => {
    beforeEach(() => {
      fetchMock.mockImplementation(url => {
        const target = String(url)
        if (target.includes('/blog/posts')) return Promise.resolve(okResponse(postsPayload))
        if (target.includes('/blog/categories')) return Promise.resolve(okResponse(categoriesPayload))
        return Promise.reject(new Error('asset down'))
      })
    })

    it('should keep the post with a null image', async () => {
      const { result, unmount } = renderHook(() => useGetLatestBlogPostsQuery())

      await flushAll()

      expect(result.current.data).toHaveLength(1)
      expect(result.current.data[0].imageUrl).toBeNull()
      unmount()
    })
  })
})
