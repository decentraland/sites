import { mapBlogAuthor, mapBlogCategory, mapBlogPost, mapContentfulAsset } from './cms.mappers'
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

  describe('when the entry is null', () => {
    it('should fall back to the default author', () => {
      expect(mapBlogAuthor(null).slug).toBe('decentraland')
    })
  })

  describe('when the entry has no fields', () => {
    it('should fall back to the default author with the entry id', () => {
      const author = mapBlogAuthor({ sys: { id: 'author-x', type: 'Entry' } } as unknown as CMSEntry)
      expect(author.id).toBe('author-x')
    })
  })

  describe('when fields is an empty object', () => {
    it('should fall back to the default author with the entry id', () => {
      const author = mapBlogAuthor({ sys: { id: 'author-y', type: 'Entry' }, fields: {} } as unknown as CMSEntry)
      expect(author.id).toBe('author-y')
    })
  })

  describe('when fields has no image', () => {
    it('should keep the author data and supply a default image', () => {
      const entry = {
        sys: { id: 'author-z', type: 'Entry' },
        fields: { id: 'someone', title: 'Someone', description: 'desc' }
      } as unknown as CMSEntry
      const author = mapBlogAuthor(entry)
      expect(author.slug).toBe('someone')
      expect(author.image.id).toBe('default-avatar')
    })

    it('should fall back to a generic title when title is missing', () => {
      const entry = {
        sys: { id: 'author-no-title', type: 'Entry' },
        fields: { id: 'noname', description: 'desc' }
      } as unknown as CMSEntry
      const author = mapBlogAuthor(entry)
      expect(author.title).toBe('Decentraland')
    })
  })
})

describe('mapBlogCategory edge cases', () => {
  describe('when the entry is null', () => {
    it('should return null', () => {
      expect(mapBlogCategory(null)).toBeNull()
    })
  })

  describe('when no id and the title cannot produce a slug', () => {
    it('should return null', () => {
      const entry = { sys: { id: 'cat-empty', type: 'Entry' }, fields: { image: makeAsset() } } as unknown as CMSEntry
      expect(mapBlogCategory(entry)).toBeNull()
    })
  })

  describe('when the image is invalid', () => {
    it('should return null', () => {
      const entry = {
        sys: { id: 'cat-1', type: 'Entry' },
        fields: { id: 'slug', title: 'Title' }
      } as unknown as CMSEntry
      expect(mapBlogCategory(entry)).toBeNull()
    })
  })
})

describe('mapContentfulAsset edge cases', () => {
  it('should return null for null input', () => {
    expect(mapContentfulAsset(null)).toBeNull()
  })

  it('should return null when fields.file is missing', () => {
    expect(mapContentfulAsset({ sys: { id: 'x', type: 'Asset' }, fields: {} } as unknown as ReturnType<typeof makeAsset>)).toBeNull()
  })

  it('should return null when fields.file.url is missing', () => {
    expect(
      mapContentfulAsset({ sys: { id: 'x', type: 'Asset' }, fields: { file: {} } } as unknown as ReturnType<typeof makeAsset>)
    ).toBeNull()
  })

  it('should preserve https URLs as-is', () => {
    const asset = mapContentfulAsset({
      sys: { id: 'x', type: 'Asset' },
      fields: { file: { url: 'https://cdn.example/a.png', contentType: 'image/jpeg', details: { image: {} } } }
    } as unknown as ReturnType<typeof makeAsset>)
    expect(asset?.url).toBe('https://cdn.example/a.png')
  })
})

describe('mapBlogPost edge cases', () => {
  it('should return null when the entry has no fields', () => {
    expect(mapBlogPost({ sys: { id: 'p', type: 'Entry' } } as unknown as CMSEntry)).toBeNull()
  })

  it('should return null for null input', () => {
    expect(mapBlogPost(null)).toBeNull()
  })

  it('should fall back to the default category when the category cannot be mapped', () => {
    const entry = {
      sys: { id: 'p', type: 'Entry' },
      fields: {
        id: 'slug',
        title: 'Title',
        description: 'desc',
        publishedDate: '2026-01-01T00:00:00Z',
        image: makeAsset(),
        category: null,
        author: null
      }
    } as unknown as CMSEntry
    const post = mapBlogPost(entry)
    expect(post?.category.slug).toBe('uncategorized')
  })

  it('should fall back to the default image when the post image is invalid', () => {
    const entry = {
      sys: { id: 'p', type: 'Entry' },
      fields: {
        id: 'slug',
        title: 'Title',
        description: 'desc',
        publishedDate: '2026-01-01T00:00:00Z',
        author: null
      }
    } as unknown as CMSEntry
    const post = mapBlogPost(entry)
    expect(post?.image.id).toBe('p')
  })
})
