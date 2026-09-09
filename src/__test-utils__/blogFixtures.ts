import type { BlogAuthor, BlogCategory, BlogPost, ContentfulAsset } from '../shared/blog/types/blog.domain'

const asset = (overrides: Partial<ContentfulAsset> = {}): ContentfulAsset => ({
  id: 'asset-1',
  url: 'https://cms-images.decentraland.org/a.png',
  width: 1200,
  height: 630,
  mimeType: 'image/png',
  ...overrides
})

const createBlogCategory = (overrides: Partial<BlogCategory> = {}): BlogCategory => ({
  id: 'cat-1',
  slug: 'announcements',
  title: 'Announcements',
  description: '',
  image: asset({ id: 'cat-image' }),
  isShownInMenu: true,
  url: '/blog/announcements',
  ...overrides
})

const createBlogAuthor = (overrides: Partial<BlogAuthor> = {}): BlogAuthor => ({
  id: 'author-1',
  slug: 'bay-backner',
  title: 'Bay Backner',
  description: '',
  image: asset({ id: 'author-image', url: 'https://cms-images.decentraland.org/author.png', width: 64, height: 64 }),
  url: '/blog/author/bay-backner',
  ...overrides
})

/**
 * `publishedDate` is deliberately the raw ISO value the CMS mapper stores, so specs that
 * assert `<time datetime>` or a formatted display string both exercise the real contract.
 */
const createBlogPost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  id: 'post-1',
  slug: 'a-post',
  title: 'A post title',
  description: 'A standfirst that is not a heading.',
  publishedDate: '2026-09-04T07:00-07:00',
  body: { nodeType: 'document', data: {}, content: [] } as unknown as BlogPost['body'],
  bodyAssets: {},
  image: asset(),
  category: createBlogCategory(),
  author: createBlogAuthor(),
  url: '/blog/announcements/a-post',
  ...overrides
})

export { createBlogAuthor, createBlogCategory, createBlogPost }
