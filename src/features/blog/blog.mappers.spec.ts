import { mapBlogAuthor, mapBlogCategory, mapBlogPost } from './blog.mappers'
import type { CMSEntry } from './cms.types'

const makeAsset = () => ({
  sys: { id: 'asset-1', type: 'Asset' },
  fields: {
    file: {
      url: '//images.example.com/a.png',
      contentType: 'image/png',
      details: { image: { width: 10, height: 10 } }
    }
  }
})

describe('mapBlogPost', () => {
  describe('when the title contains a literal &amp; entity', () => {
    let entry: CMSEntry
    beforeEach(() => {
      entry = {
        sys: { id: 'post-1', type: 'Entry' },
        fields: {
          id: 'q-and-a',
          title: 'Q&amp;A with Creative Departmint',
          description: 'Agora: Results &amp; New Polls',
          publishedDate: '2022-08-09T00:00:00Z',
          image: makeAsset(),
          category: {
            sys: { id: 'cat-1', type: 'Entry' },
            fields: { id: 'community-highlights', title: 'Community Highlights', image: makeAsset() }
          },
          author: {
            sys: { id: 'author-1', type: 'Entry' },
            fields: { id: 'author', title: 'Author Name', image: makeAsset() }
          }
        }
      } as unknown as CMSEntry
    })

    it('should decode the title to a plain ampersand', () => {
      const post = mapBlogPost(entry)
      expect(post?.title).toBe('Q&A with Creative Departmint')
    })

    it('should decode the description to a plain ampersand', () => {
      const post = mapBlogPost(entry)
      expect(post?.description).toBe('Agora: Results & New Polls')
    })
  })
})

describe('mapBlogCategory', () => {
  describe('when the title contains encoded entities', () => {
    it('should decode the title', () => {
      const entry = {
        sys: { id: 'cat-1', type: 'Entry' },
        fields: {
          id: 'community-highlights',
          title: 'Community &amp; Highlights',
          description: 'desc',
          image: makeAsset()
        }
      } as unknown as CMSEntry
      const category = mapBlogCategory(entry)
      expect(category?.title).toBe('Community & Highlights')
    })
  })

  describe('when fields.id is missing and the title contains &amp;', () => {
    it('should slugify from the raw title to preserve URL stability', () => {
      const entry = {
        sys: { id: 'cat-1', type: 'Entry' },
        fields: {
          title: 'Community &amp; Highlights',
          description: 'desc',
          image: makeAsset()
        }
      } as unknown as CMSEntry
      const category = mapBlogCategory(entry)
      // slugify on the raw title drops `&amp;` → `amp` segment, matching pre-fix behaviour.
      expect(category?.slug).toBe('community-amp-highlights')
    })
  })
})

describe('mapBlogAuthor', () => {
  describe('when the title contains encoded entities', () => {
    it('should decode the title', () => {
      const entry = {
        sys: { id: 'author-1', type: 'Entry' },
        fields: {
          id: 'author',
          title: 'Foo &amp; Bar',
          description: 'desc',
          image: makeAsset()
        }
      } as unknown as CMSEntry
      const author = mapBlogAuthor(entry)
      expect(author.title).toBe('Foo & Bar')
    })
  })
})
