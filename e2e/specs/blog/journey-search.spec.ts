// See e2e/README.md for the suite's mental model (isolated when/and/should tests).
import { searchHits } from '../../fixtures/blog/search'
import { mockBlogApi } from '../../mocks/blog'
import type { Locator } from '@playwright/test'
import { BlogListingPage, BlogNavbar, BlogPostDetailPage, BlogSearchPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

const FIRST_HIT_SLUG = searchHits[0].fields.id as string

test.describe('when a reader types a query in the navbar search input', () => {
  let navbar: BlogNavbar

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, {})
    navbar = new BlogNavbar(page)
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await navbar.typeSearch('metaverse')
  })

  test('should populate the dropdown with search hits', async () => {
    await expect(navbar.searchDropdownHits().first()).toBeVisible()
  })
})

test.describe('when a reader clicks a hit in the navbar dropdown', () => {
  test('should navigate to the detail page of that hit', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    const detail = new BlogPostDetailPage(page)

    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await navbar.typeSearch('metaverse')
    await expect(navbar.searchDropdownHits().first()).toBeVisible()
    await navbar.searchDropdownHits().first().getByRole('link').click()
    await page.waitForURL(`**/blog/**/${FIRST_HIT_SLUG}`)
    await expect(detail.title()).toBeVisible()
  })
})

test.describe('when a reader presses Enter on the navbar search without selecting a hit', () => {
  test('should navigate to the /blog/search results page', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await navbar.typeSearch('metaverse')
    await expect(navbar.searchDropdownHits().first()).toBeVisible()
    await navbar.searchInput().press('Enter')
    await page.waitForURL('**/blog/search?q=metaverse')
    expect(page.url()).toContain('/blog/search?q=metaverse')
  })

  test('should render the matching search results on /blog/search', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    const search = new BlogSearchPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await navbar.typeSearch('metaverse')
    await expect(navbar.searchDropdownHits().first()).toBeVisible()
    await navbar.searchInput().press('Enter')
    await page.waitForURL('**/blog/search?q=metaverse')
    await expect.poll(async () => search.results().count()).toBeGreaterThanOrEqual(searchHits.length)
  })
})

test.describe('when a search returns no matches', () => {
  test('should render the empty state on /blog/search', async ({ page }) => {
    await mockBlogApi(page, { search: 'empty' })
    const search = new BlogSearchPage(page)
    await search.goto('zzznoresults')
    await expect(search.emptyState()).toBeVisible()
  })
})

test.describe('when /blog/search has more results than fit on one page', () => {
  let search: BlogSearchPage
  let loadMore: Locator

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, { searchPage: 'paginated' })
    search = new BlogSearchPage(page)
    await search.goto('paginated')
    loadMore = page.getByRole('button', { name: /load more/i })
    await expect(loadMore).toBeVisible()
  })

  test('should render at least the first ten hits', async () => {
    await expect.poll(async () => search.results().count()).toBeGreaterThanOrEqual(10)
  })

  test('should render the load-more button', async () => {
    await expect(loadMore).toBeVisible()
  })

  test('should load the next page when the button is clicked', async () => {
    await loadMore.click()
    await expect.poll(async () => search.results().count()).toBeGreaterThanOrEqual(15)
  })

  test('should hide the load-more button after all pages are loaded', async () => {
    await loadMore.click()
    await expect.poll(async () => search.results().count()).toBeGreaterThanOrEqual(15)
    await expect(loadMore).toHaveCount(0)
  })
})

test.describe('when a keyboard user navigates the navbar dropdown with ArrowDown + Enter', () => {
  test('should navigate to the first hit detail', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    const detail = new BlogPostDetailPage(page)

    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await navbar.typeSearch('metaverse')
    await expect(navbar.searchDropdownHits().first()).toBeVisible()
    await navbar.searchInput().press('ArrowDown')
    await navbar.searchInput().press('Enter')
    await page.waitForURL(`**/blog/**/${FIRST_HIT_SLUG}`)
    await expect(detail.title()).toBeVisible()
  })
})

test.describe('when the navbar dropdown has more than four hits', () => {
  let navbar: BlogNavbar

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, { search: 'overflow' })
    navbar = new BlogNavbar(page)
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await navbar.typeSearch('paginated')
    await expect(navbar.searchDropdownHits().first()).toBeVisible()
  })

  test('should render the see-more-results link', async () => {
    await expect(navbar.searchSeeMoreLink()).toBeVisible()
  })

  test('should point the see-more link to /blog/search with the query', async () => {
    await expect(navbar.searchSeeMoreLink()).toHaveAttribute('href', /\/blog\/search\?q=paginated/)
  })
})

test.describe('when a reader presses Escape with the navbar dropdown open', () => {
  test('should close the dropdown', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await navbar.typeSearch('metaverse')
    await expect(navbar.searchDropdownHits().first()).toBeVisible()
    await navbar.searchInput().press('Escape')
    await expect(navbar.searchDropdownHits()).toHaveCount(0)
  })
})
