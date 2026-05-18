import { expect, test } from '@playwright/test'
import { searchHits } from '../../fixtures/blog/search'
import { mockBlogApi } from '../../mocks/blog'
import { watchUnmockedCmsRequests } from '../../mocks/shared'
import { BlogListingPage, BlogNavbar, BlogPostDetailPage, BlogSearchPage } from '../../pages/blog.page'

// Flow: a user lands on /blog, uses the navbar search to type a query, picks
// the first hit with ArrowDown + Enter, and lands on its detail page.
// Also covers the search results page reached by the magnifier path: typing
// then submitting without picking a specific hit redirects to /blog/search.

test.describe('User journey: search blog', () => {
  let unmocked: { errors: string[] }

  test.beforeEach(({ page }) => {
    unmocked = watchUnmockedCmsRequests(page)
  })

  test.afterEach(() => {
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  })

  test('opens the first hit when clicked in the dropdown', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    const detail = new BlogPostDetailPage(page)

    const firstHit = searchHits[0]
    const firstHitSlug = firstHit.fields.id as string

    await blog.goto()
    await expect(blog.postList()).toBeVisible({ timeout: 15_000 })

    // 1. Type into the navbar search input and wait for the dropdown to
    // populate. fill triggers the debounce + RTK query; the first hit becoming
    // visible is our handshake that the dropdown is ready to be clicked.
    await navbar.typeSearch('metaverse')
    await expect(navbar.searchDropdownHits().first()).toBeVisible({ timeout: 10_000 })

    // 2. Click the link inside the first hit. Each <li> contains an <a> that
    // navigates to `/blog/<categorySlug>/<id>`.
    await navbar.searchDropdownHits().first().getByRole('link').click()

    await page.waitForURL(`**/blog/**/${firstHitSlug}`)
    await expect(detail.title()).toBeVisible()
  })

  test('submits an unselected query and lands on /blog/search with results', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    const search = new BlogSearchPage(page)

    await blog.goto()
    await expect(blog.postList()).toBeVisible({ timeout: 15_000 })

    await navbar.typeSearch('metaverse')
    await expect(navbar.searchDropdownHits().first()).toBeVisible({ timeout: 10_000 })

    // Pressing Enter without an active selection navigates to the search page.
    await navbar.searchInput().press('Enter')

    await page.waitForURL('**/blog/search?q=metaverse')
    // The results list should show at least the hits we mocked.
    await expect.poll(async () => search.results().count(), { timeout: 10_000 }).toBeGreaterThanOrEqual(searchHits.length)
  })

  test('shows the empty state when there are no matches', async ({ page }) => {
    await mockBlogApi(page, { search: 'empty' })
    const search = new BlogSearchPage(page)
    await search.goto('zzznoresults')
    await expect(search.emptyState()).toBeVisible({ timeout: 15_000 })
  })
})
