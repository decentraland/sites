import type { BlogPost } from '../types/blog.domain'
import { locations } from './locations'

const buildPost = (overrides: Partial<BlogPost> = {}): BlogPost =>
  ({
    id: 'post-1',
    slug: 'announcing-x',
    title: 'Announcing X',
    description: 'desc',
    publishedDate: '',
    body: {},
    bodyAssets: {},
    image: { id: 'img', url: '', width: 0, height: 0, mimeType: 'image/png' },
    category: {
      id: 'c',
      slug: 'announcements',
      title: 'Announcements',
      description: '',
      image: { id: 'ci', url: '', width: 0, height: 0, mimeType: 'image/png' },
      isShownInMenu: true,
      url: '/blog/announcements'
    },
    author: {
      id: 'a',
      slug: 'jane',
      title: 'Jane',
      description: '',
      image: { id: 'ai', url: '', width: 0, height: 0, mimeType: 'image/png' },
      url: '/blog/author/jane'
    },
    url: '/blog/announcements/announcing-x',
    ...overrides
  }) as BlogPost

describe('locations', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, origin: 'https://example.test' }
    })
  })

  it('should return the home path', () => {
    expect(locations.home()).toBe('/')
  })

  it('should return the blog listing path', () => {
    expect(locations.blogs()).toBe('/blog')
  })

  it('should return the category path', () => {
    expect(locations.category('news')).toBe('/blog/news')
  })

  it('should return the blog post path', () => {
    expect(locations.blog('news', 'launch')).toBe('/blog/news/launch')
  })

  it('should return the author path', () => {
    expect(locations.author('jane-doe')).toBe('/blog/author/jane-doe')
  })

  it('should return the search path with the encoded query', () => {
    expect(locations.search('hello world')).toBe('/blog/search?q=hello%20world')
  })

  it('should return the X intent URL with the absolute post URL', () => {
    const post = buildPost()
    const url = locations.twitter(post)
    expect(url).toContain('https://x.com/intent/post')
    expect(url).toContain(encodeURIComponent('https://example.test/blog/announcements/announcing-x'))
    expect(url).toContain(encodeURIComponent('Announcing X'))
  })

  it('should return the Facebook sharer URL with the absolute post URL', () => {
    const post = buildPost()
    const url = locations.facebook(post)
    expect(url).toContain('https://www.facebook.com/sharer/sharer.php')
    expect(url).toContain(encodeURIComponent('https://example.test/blog/announcements/announcing-x'))
  })
})
