import { expect, test } from '@playwright/test'
import { mockBlogApi } from '../../mocks/blog'
import { watchUnmockedCmsRequests } from '../../mocks/shared'
import { BlogSearchPage } from '../../pages/blog.page'

test.describe('Blog search /blog/search', () => {
  let unmocked: { errors: string[] }

  test.beforeEach(({ page }) => {
    unmocked = watchUnmockedCmsRequests(page)
  })

  test.afterEach(() => {
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  })

  test('happy: renders search results from CMS', async ({ page }) => {
    await mockBlogApi(page, { search: 'happy' })
    const search = new BlogSearchPage(page)
    await search.goto('metaverse')
    // Each hit becomes a SearchResultCard with an <a> link inside <main>.
    // Fixture has 3 hits; locator may include category/author nav links that
    // happen to live in <main>, so we assert at-least-3 rather than exact-3.
    const results = search.results()
    await expect.poll(async () => await results.count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(3)
  })

  test('bad path: empty results → empty state visible', async ({ page }) => {
    await mockBlogApi(page, { search: 'empty' })
    const search = new BlogSearchPage(page)
    await search.goto('zzznoresults')
    await expect(search.emptyState()).toBeVisible({ timeout: 15_000 })
  })
  // NOTE: a "search API 500" spec used to live here but was a pure absence
  // assertion — it passed even when the page crashed entirely. Removed until
  // SearchPage exposes a real error UI we can assert against positively.
})
