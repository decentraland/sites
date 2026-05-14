import type { Page, Route } from '@playwright/test'
import type { CMSEntry, CMSListResponse } from '../../src/features/cms/cms.types'
import {
  authorAvatarAsset,
  categoryAsset,
  heroAsset,
  post1Asset,
  post2Asset,
  post3Asset,
  post4Asset,
  post5Asset,
  post6Asset,
  post7Asset,
  postsPage2Assets
} from '../fixtures/blog/assets'
import { adaAuthor, allAuthors, authorsListResponse, decentralandTeamAuthor, lindaAuthor } from '../fixtures/blog/authors'
import {
  allCategories,
  announcementsCategory,
  categoriesListResponse,
  eventsCategory,
  technologyCategory
} from '../fixtures/blog/categories'
import { createCmsListResponse } from '../fixtures/blog/cms-entry.factory'
import { detailListResponse, detailNotFoundResponse, detailPost } from '../fixtures/blog/post-detail'
import { allPostsPage1, postsPage1Response } from '../fixtures/blog/posts-page-1'
import { postsPage2Response } from '../fixtures/blog/posts-page-2'
import { searchEmptyResponse, searchHappyResponse } from '../fixtures/blog/search'
import { SENTINEL_STATUS } from './shared'
import type { BlogScenario } from './types'

const CMS_URL_RE = /cms-api\.decentraland\.org|\/api\/cms\//

// Asset & entry indexes — used to answer /assets/:id and /entries/:id without
// needing per-test wiring. Built once at module load.
const ASSETS_BY_ID = new Map<string, CMSEntry>(
  [
    heroAsset,
    categoryAsset,
    authorAvatarAsset,
    post1Asset,
    post2Asset,
    post3Asset,
    post4Asset,
    post5Asset,
    post6Asset,
    post7Asset,
    ...postsPage2Assets
  ].map(a => [a.sys.id, a])
)

const ENTRIES_BY_ID = new Map<string, CMSEntry>(
  [
    announcementsCategory,
    eventsCategory,
    technologyCategory,
    adaAuthor,
    lindaAuthor,
    decentralandTeamAuthor,
    detailPost,
    ...allPostsPage1
  ].map(e => [e.sys.id, e])
)

function jsonResponse(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body)
  })
}

function errorResponse(route: Route) {
  return route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'mocked server error' })
  })
}

function emptyListResponse(): CMSListResponse {
  return createCmsListResponse([], 0)
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// /blog/posts variants ---------------------------------------------------------

function handlePostsBySlug(route: Route, slug: string, scenario: BlogScenario) {
  switch (scenario.postBySlug ?? 'happy') {
    case 'happy':
      // Only respond with detail if the slug matches the detail fixture.
      // Other slugs fall back to empty (lets us simulate "not found" for arbitrary urls).
      if (slug === detailPost.fields.id) return jsonResponse(route, detailListResponse)
      return jsonResponse(route, detailNotFoundResponse)
    case 'not-found':
      return jsonResponse(route, detailNotFoundResponse)
    case 'error':
      return errorResponse(route)
  }
}

function handlePostsSearch(route: Route, scenario: BlogScenario) {
  switch (scenario.search ?? 'happy') {
    case 'happy':
      return jsonResponse(route, searchHappyResponse)
    case 'empty':
      return jsonResponse(route, searchEmptyResponse)
    case 'error':
      return errorResponse(route)
  }
}

function handlePostsByCategory(route: Route, categorySlug: string, scenario: BlogScenario) {
  switch (scenario.postsByCategory ?? 'happy') {
    case 'happy': {
      const matching = allPostsPage1.filter(post => {
        const cat = post.fields.category as CMSEntry | undefined
        return cat?.fields.id === categorySlug
      })
      return jsonResponse(route, createCmsListResponse(matching, matching.length))
    }
    case 'empty':
      return jsonResponse(route, emptyListResponse())
    case 'error':
      return errorResponse(route)
  }
}

function handlePostsByAuthor(route: Route, authorSlug: string, scenario: BlogScenario) {
  switch (scenario.postsByAuthor ?? 'happy') {
    case 'happy': {
      const matching = allPostsPage1.filter(post => {
        const author = post.fields.author as CMSEntry | undefined
        return author?.fields.id === authorSlug
      })
      return jsonResponse(route, createCmsListResponse(matching, matching.length))
    }
    case 'empty':
      return jsonResponse(route, emptyListResponse())
    case 'error':
      return errorResponse(route)
  }
}

function handlePostsListing(route: Route, skip: number, scenario: BlogScenario) {
  if (skip > 0) {
    const page2Mode = scenario.postsPage2 ?? (scenario.posts === 'multi-page' ? 'happy' : scenario.posts) ?? 'happy'
    if (page2Mode === 'error') return errorResponse(route)
    if (page2Mode === 'empty') return jsonResponse(route, emptyListResponse())
    return jsonResponse(route, postsPage2Response)
  }
  switch (scenario.posts ?? 'happy') {
    case 'happy':
    case 'multi-page':
      return jsonResponse(route, postsPage1Response)
    case 'empty':
      return jsonResponse(route, emptyListResponse())
    case 'error':
      return errorResponse(route)
  }
}

// /blog/categories, /blog/authors ---------------------------------------------

function handleCategories(route: Route, scenario: BlogScenario) {
  switch (scenario.categories ?? 'happy') {
    case 'happy':
      return jsonResponse(route, categoriesListResponse)
    case 'empty':
      return jsonResponse(route, createCmsListResponse(allCategories.slice(0, 0), 0))
    case 'error':
      return errorResponse(route)
  }
}

function handleAuthors(route: Route, scenario: BlogScenario) {
  switch (scenario.authors ?? 'happy') {
    case 'happy':
      return jsonResponse(route, authorsListResponse)
    case 'empty':
      return jsonResponse(route, createCmsListResponse(allAuthors.slice(0, 0), 0))
    case 'error':
      return errorResponse(route)
  }
}

// /entries/:id, /assets/:id ---------------------------------------------------

function handleEntry(route: Route, id: string, scenario: BlogScenario) {
  if ((scenario.entry ?? 'happy') === 'not-found') {
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'entry not found' }) })
  }
  const entry = ENTRIES_BY_ID.get(id)
  if (!entry) {
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'entry not found' }) })
  }
  return jsonResponse(route, entry)
}

function handleAsset(route: Route, id: string, scenario: BlogScenario) {
  if ((scenario.asset ?? 'happy') === 'not-found') {
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'asset not found' }) })
  }
  const asset = ASSETS_BY_ID.get(id)
  if (!asset) {
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'asset not found' }) })
  }
  return jsonResponse(route, asset)
}

// Dispatcher ------------------------------------------------------------------

export async function mockBlogApi(page: Page, scenario: BlogScenario = {}) {
  await page.route(CMS_URL_RE, async route => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const params = url.searchParams

    if (scenario.postsDelayMs && path.endsWith('/blog/posts')) {
      await delay(scenario.postsDelayMs)
    }

    if (path.endsWith('/blog/posts')) {
      const slug = params.get('slug')
      const q = params.get('q')
      const category = params.get('category')
      const author = params.get('author')
      const skip = Number(params.get('skip') ?? '0')

      if (q) return handlePostsSearch(route, scenario)
      if (slug) return handlePostsBySlug(route, slug, scenario)
      if (category) return handlePostsByCategory(route, category, scenario)
      if (author) return handlePostsByAuthor(route, author, scenario)
      return handlePostsListing(route, skip, scenario)
    }

    if (path.endsWith('/blog/categories')) return handleCategories(route, scenario)
    if (path.endsWith('/blog/authors')) return handleAuthors(route, scenario)

    const entryMatch = path.match(/\/entries\/([^/]+)$/)
    if (entryMatch) return handleEntry(route, entryMatch[1], scenario)

    const assetMatch = path.match(/\/assets\/([^/]+)$/)
    if (assetMatch) return handleAsset(route, assetMatch[1], scenario)

    return route.fulfill({
      status: SENTINEL_STATUS,
      contentType: 'text/plain',
      body: `Unmocked CMS request: ${path}${url.search}`
    })
  })
}
