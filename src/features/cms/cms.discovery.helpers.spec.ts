import { buildLatestPosts, formatPostDate, normalizeAssetUrl } from './cms.discovery.helpers'
import type { CMSCategoriesResponse, CMSPostItem } from './cms.discovery.types'

const aPost = (overrides: Partial<CMSPostItem['fields']> = {}, sysId = 'post-sys-1'): CMSPostItem => ({
  sys: { id: sysId },
  fields: {
    id: 'my-post-slug',
    title: 'My Post',
    publishedDate: '2026-06-15T11:00-07:00',
    image: { sys: { id: 'asset-1', type: 'Link', linkType: 'Asset' } },
    category: { sys: { id: 'cat-sys-1', type: 'Link', linkType: 'Entry' } },
    ...overrides
  }
})

const categories: CMSCategoriesResponse = {
  items: [{ sys: { id: 'cat-sys-1' }, fields: { id: 'community-highlights', title: 'Community Highlights' } }]
}

describe('normalizeAssetUrl', () => {
  describe('when the url is protocol-relative', () => {
    it('should prefix https', () => {
      expect(normalizeAssetUrl('//images.ctfassets.net/x/y.png')).toBe('https://images.ctfassets.net/x/y.png')
    })
  })

  describe('when the url is absolute', () => {
    it('should return it unchanged', () => {
      expect(normalizeAssetUrl('https://images.ctfassets.net/x/y.png')).toBe('https://images.ctfassets.net/x/y.png')
    })
  })
})

describe('buildLatestPosts', () => {
  describe('when the post has a resolvable category and image', () => {
    it('should build a fully-populated post linking to the blog post page', () => {
      const assetUrlById = new Map([['asset-1', '//images.ctfassets.net/a.png']])

      const result = buildLatestPosts([aPost()], categories, assetUrlById)

      expect(result).toEqual([
        {
          id: 'post-sys-1',
          title: 'My Post',
          publishedDate: '2026-06-15T11:00-07:00',
          categoryTitle: 'Community Highlights',
          imageUrl: 'https://images.ctfassets.net/a.png',
          url: '/blog/community-highlights/my-post-slug'
        }
      ])
    })
  })

  describe('when the category cannot be resolved', () => {
    it('should fall back to the blog search page', () => {
      const result = buildLatestPosts([aPost()], null, new Map())

      expect(result[0].categoryTitle).toBeNull()
      expect(result[0].url).toBe('/blog/search?q=My%20Post')
    })
  })

  describe('when the post has no image, date or category link', () => {
    it('should keep the nullable fields null', () => {
      const result = buildLatestPosts([aPost({ image: undefined, publishedDate: undefined, category: undefined })], categories, new Map())

      expect(result[0].imageUrl).toBeNull()
      expect(result[0].publishedDate).toBeNull()
      expect(result[0].categoryTitle).toBeNull()
    })
  })

  describe('when a post is missing its slug or title', () => {
    it('should skip it', () => {
      const noSlug = aPost({ id: '' }, 'post-sys-2')
      const noTitle = aPost({ title: '' }, 'post-sys-3')

      const result = buildLatestPosts([noSlug, noTitle, aPost()], categories, new Map())

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('post-sys-1')
    })
  })

  describe('when a category item is missing its slug', () => {
    it('should not index it', () => {
      const badCategories: CMSCategoriesResponse = {
        items: [{ sys: { id: 'cat-sys-1' }, fields: { id: '', title: 'Broken' } }]
      }

      const result = buildLatestPosts([aPost()], badCategories, new Map())

      expect(result[0].categoryTitle).toBeNull()
    })
  })
})

describe('formatPostDate', () => {
  describe('when the date is null', () => {
    it('should return an empty string', () => {
      expect(formatPostDate(null)).toBe('')
    })
  })

  describe('when the date is unparseable', () => {
    it('should return an empty string', () => {
      expect(formatPostDate('not-a-date')).toBe('')
    })
  })

  describe('when the date is valid', () => {
    it('should format it as a long en-US date', () => {
      expect(formatPostDate('2026-06-15T12:00:00Z')).toMatch(/June 1[45], 2026/)
    })
  })
})
