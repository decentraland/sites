// See e2e/README.md for the suite's mental model (spec = user journey).
import { searchHits } from '../../fixtures/blog/search'
import { mockBlogApi } from '../../mocks/blog'
import { BlogListingPage, BlogNavbar, BlogPostDetailPage, BlogSearchPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

test.describe('Searching the blog', () => {
  test('a reader can search, pick the top hit from the dropdown, and read it', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    const detail = new BlogPostDetailPage(page)

    const firstHit = searchHits[0]
    const firstHitSlug = firstHit.fields.id as string

    await blog.goto()
    await expect(blog.postList()).toBeVisible()

    // 1. Type into the navbar search input and wait for the dropdown to
    // populate. fill triggers the debounce + RTK query; the first hit becoming
    // visible is our handshake that the dropdown is ready to be clicked.
    await navbar.typeSearch('metaverse')
    await expect(navbar.searchDropdownHits().first()).toBeVisible()

    // 2. Click the link inside the first hit.
    await navbar.searchDropdownHits().first().getByRole('link').click()

    await page.waitForURL(`**/blog/**/${firstHitSlug}`)
    await expect(detail.title()).toBeVisible()
  })

  test('when the reader submits a search without picking a hit, they land on the results page', async ({ page }) => {
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

  test('when a search has no matches, the reader sees an empty state', async ({ page }) => {
    await mockBlogApi(page, { search: 'empty' })
    const search = new BlogSearchPage(page)
    await search.goto('zzznoresults')
    await expect(search.emptyState()).toBeVisible()
  })

  test('when there are more results than fit on a page, the reader can load more', async ({ page }) => {
    await mockBlogApi(page, { searchPage: 'paginated' })
    const search = new BlogSearchPage(page)
    await search.goto('paginated')

    // First page renders 10 results + a Load More button.
    await expect.poll(async () => search.results().count()).toBeGreaterThanOrEqual(10)
    const loadMore = page.getByRole('button', { name: /load more/i })
    await expect(loadMore).toBeVisible()

    await loadMore.click()

    // After loading: 15 total, button gone.
    await expect.poll(async () => search.results().count()).toBeGreaterThanOrEqual(15)
    await expect(loadMore).toHaveCount(0)
  })

  test('a keyboard user can pick a hit with ArrowDown + Enter', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    const detail = new BlogPostDetailPage(page)

    const firstHit = searchHits[0]
    const firstHitSlug = firstHit.fields.id as string

    await blog.goto()
    await expect(blog.postList()).toBeVisible()

    await navbar.typeSearch('metaverse')
    await expect(navbar.searchDropdownHits().first()).toBeVisible()

    await navbar.searchInput().press('ArrowDown')
    await navbar.searchInput().press('Enter')

    await page.waitForURL(`**/blog/**/${firstHitSlug}`)
    await expect(detail.title()).toBeVisible()
  })

  test('when there are more than four hits, a "see more results" link points to the full search page', async ({ page }) => {
    await mockBlogApi(page, { search: 'overflow' })
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)

    await blog.goto()
    await expect(blog.postList()).toBeVisible()

    await navbar.typeSearch('paginated')
    await expect(navbar.searchDropdownHits().first()).toBeVisible()

    await expect(navbar.searchSeeMoreLink()).toBeVisible()
    await expect(navbar.searchSeeMoreLink()).toHaveAttribute('href', /\/blog\/search\?q=paginated/)
  })

  test('pressing Escape closes the dropdown', async ({ page }) => {
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
