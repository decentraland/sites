// Shared fixtures for blog component unit tests. Keep purpose-specific:
// these are NOT the E2E fixtures (those live under e2e/fixtures/blog and
// model the raw CMSEntry shape). Here we return already-mapped BlogPost
// domain objects ready to feed components directly.

import type { Document } from '@contentful/rich-text-types'
import type { BlogAuthor, BlogCategory, BlogPost, ContentfulAsset, SearchResult } from '../../../shared/blog/types/blog.domain'

function makeAsset(overrides: Partial<ContentfulAsset> = {}): ContentfulAsset {
  return {
    id: 'asset-1',
    url: 'https://fake-cdn.test/asset-1.png',
    width: 1200,
    height: 630,
    mimeType: 'image/png',
    ...overrides
  }
}

function makeCategory(overrides: Partial<BlogCategory> = {}): BlogCategory {
  return {
    id: 'cat-1',
    slug: 'announcements',
    title: 'Announcements',
    description: 'Announcements category',
    image: makeAsset({ id: 'asset-cat' }),
    isShownInMenu: true,
    url: '/blog/announcements',
    ...overrides
  }
}

function makeAuthor(overrides: Partial<BlogAuthor> = {}): BlogAuthor {
  return {
    id: 'author-1',
    slug: 'dcl-team',
    title: 'Decentraland Team',
    description: 'Official Decentraland communications',
    image: makeAsset({ id: 'asset-author' }),
    url: '/blog/author/dcl-team',
    ...overrides
  }
}

function makeDocument(text = 'Body paragraph one.'): Document {
  return {
    nodeType: 'document',
    data: {},
    content: [
      {
        nodeType: 'paragraph',
        data: {},
        content: [{ nodeType: 'text', value: text, marks: [], data: {} }]
      }
    ]
  } as Document
}

function makePost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'post-1',
    slug: 'welcome-post',
    title: 'Welcome Post',
    description: 'A welcoming description.',
    publishedDate: '2026-01-20T10:00:00.000Z',
    body: makeDocument(),
    bodyAssets: {},
    image: makeAsset({ id: 'asset-post' }),
    category: makeCategory(),
    author: makeAuthor(),
    url: '/blog/announcements/welcome-post',
    ...overrides
  }
}

function makeSearchResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    url: '/blog/announcements/welcome-post',
    image: 'https://fake-cdn.test/search.png',
    highlightedTitle: '<em>Welcome</em> Post',
    highlightedDescription: 'A welcoming description.',
    ...overrides
  }
}

export { makeAsset, makeAuthor, makeCategory, makeDocument, makePost, makeSearchResult }
