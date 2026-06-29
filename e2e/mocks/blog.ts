// mockBlogApi(page, scenario)
//
// Installs `page.route` handlers over every CMS endpoint blog talks to.
//
// CONTRACT:
// 1. Call this BEFORE the first `page.goto(...)` — handlers must be ready
//    before React mounts and fires the first fetch.
// 2. Pair it with `watchUnmockedCmsRequests(page)` in beforeEach. Any CMS URL
//    not matched by a handler is short-circuited to `UNMOCKED_CMS_STATUS`
//    (599), which the watcher converts into an afterEach failure.
// 3. Add new shapes here: extend `BlogScenario` (mocks/types.ts), add a
//    handler branch, and seed a fixture under fixtures/blog/ — then run
//    `npm run e2e:check-fixtures` to validate the cross-refs.
//
// Anything that is NOT the CMS (third-party telemetry, assets-cdn, etc.)
// passes through naturally because the dispatcher's regex doesn't match it.
// To kill telemetry noise see `blockThirdParties` in mocks/shared.ts.
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
import { detailNotFoundResponse, detailPost } from '../fixtures/blog/post-detail'
import { allPostsPage1, postsPage1Response } from '../fixtures/blog/posts-page-1'
import { postsPage2, postsPage2Response } from '../fixtures/blog/posts-page-2'
import {
  paginatedSearchHits,
  searchEmptyResponse,
  searchHappyResponse,
  searchHits,
  searchPaginatedFirstPage,
  searchPaginatedSecondPage
} from '../fixtures/blog/search'
import { UNMOCKED_CMS_STATUS } from './shared'
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
    ...allPostsPage1,
    ...postsPage2
  ].map(e => [e.sys.id, e])
)

// All posts the fixture set knows about. Used by handlePostsBySlug so user
// journeys can navigate by clicking real cards or search hits (any visible
// slug resolves to a CMSEntry).
const ALL_KNOWN_POSTS: CMSEntry[] = [...allPostsPage1, ...postsPage2, detailPost, ...searchHits, ...paginatedSearchHits]

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
    case 'happy': {
      // Match against every known post (page 1, page 2, detail). User journeys
      // navigate by clicking real cards so the requested slug rotates over the
      // whole fixture set; restricting this to a single slug forced earlier
      // specs to dodge navigation.
      const known = ALL_KNOWN_POSTS.find(p => p.fields.id === slug)
      if (known) return jsonResponse(route, createCmsListResponse([known], 1))
      return jsonResponse(route, detailNotFoundResponse)
    }
    case 'not-found':
      return jsonResponse(route, detailNotFoundResponse)
    case 'error':
      return errorResponse(route)
  }
}

function handlePostsSearch(route: Route, scenario: BlogScenario, params: URLSearchParams) {
  const limit = Number(params.get('limit') ?? '0')
  const page = Number(params.get('page') ?? '0')

  // SearchPage requests use limit=10. The dispatcher routes those through
  // `scenario.searchPage` so /blog/search-specific behaviour (paginated,
  // error, empty) can be set independently from the navbar dropdown.
  const isSearchPage = limit >= 10
  const mode = isSearchPage ? scenario.searchPage ?? scenario.search ?? 'happy' : scenario.search ?? 'happy'

  switch (mode) {
    case 'paginated':
      return jsonResponse(route, page === 0 ? searchPaginatedFirstPage : searchPaginatedSecondPage)
    case 'overflow':
      // 10 hits so the navbar dropdown (slice(0,4) + "see more") renders.
      return jsonResponse(route, searchPaginatedFirstPage)
    case 'happy':
      return jsonResponse(route, searchHappyResponse)
    case 'empty':
      return jsonResponse(route, searchEmptyResponse)
    case 'error':
      return errorResponse(route)
  }
}

function handlePostsByCategory(route: Route, categoryId: string, scenario: BlogScenario) {
  switch (scenario.postsByCategory ?? 'happy') {
    case 'happy': {
      // The app's RTK Query sends `category: displayPost.category.id` which is
      // the entry sys.id (e.g. `cat-announcements`), while navbar/category
      // pages send the slug (e.g. `announcements`). Match either so both
      // call sites resolve.
      const matching = ALL_KNOWN_POSTS.filter(post => {
        const cat = post.fields.category as CMSEntry | undefined
        return cat?.fields.id === categoryId || cat?.sys.id === categoryId
      })
      return jsonResponse(route, createCmsListResponse(matching, matching.length))
    }
    case 'empty':
      return jsonResponse(route, emptyListResponse())
    case 'error':
      return errorResponse(route)
  }
}

function handlePostsByAuthor(route: Route, authorId: string, scenario: BlogScenario) {
  switch (scenario.postsByAuthor ?? 'happy') {
    case 'happy': {
      const matching = ALL_KNOWN_POSTS.filter(post => {
        const author = post.fields.author as CMSEntry | undefined
        return author?.fields.id === authorId || author?.sys.id === authorId
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

      if (q) return handlePostsSearch(route, scenario, params)
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
      status: UNMOCKED_CMS_STATUS,
      contentType: 'text/plain',
      body: `Unmocked CMS request: ${path}${url.search}`
    })
  })
}
