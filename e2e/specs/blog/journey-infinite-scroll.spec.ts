import { expect, test } from '@playwright/test'
import { postsPage2 } from '../../fixtures/blog/posts-page-2'
import { mockBlogApi } from '../../mocks/blog'
import { watchUnmockedCmsRequests } from '../../mocks/shared'
import { BlogListingPage, BlogPostDetailPage } from '../../pages/blog.page'

// Flow: a user lands on /blog, scrolls to trigger the second page load, picks
// a card from page 2, reads its detail, presses browser back, and confirms
// the listing state is preserved (no full re-fetch, scrolled position kept).

test.describe('User journey: infinite scroll then deep-read', () => {
  let unmocked: { errors: string[] }

  test.beforeEach(({ page }) => {
    unmocked = watchUnmockedCmsRequests(page)
  })

  test.afterEach(() => {
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  })

  test('loads page 2 on scroll, opens an older post, and preserves the list on back', async ({ page }) => {
    await mockBlogApi(page, { posts: 'multi-page', postsDelayMs: 100 })
    const blog = new BlogListingPage(page)
    const detail = new BlogPostDetailPage(page)

    // 1. Land on /blog and snapshot the initial card count.
    await blog.goto()
    await expect(blog.postList()).toBeVisible({ timeout: 15_000 })
    const initialCount = await blog.cards().count()
    expect(initialCount).toBeGreaterThan(0)

    // 2. Register the page-2 fetch watcher BEFORE the scroll so we don't race.
    const page2Request = page.waitForRequest(req => {
      try {
        const u = new URL(req.url())
        if (!u.pathname.endsWith('/blog/posts')) return false
        return Number(u.searchParams.get('skip') ?? '0') > 0
      } catch {
        return false
      }
    })

    // Scroll to the bottom — the useInfiniteScroll hook listens on window scroll.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page2Request

    // Wait for new cards to be appended.
    await expect.poll(async () => blog.cards().count(), { timeout: 15_000 }).toBeGreaterThan(initialCount)
    const afterScrollCount = await blog.cards().count()

    // 3. Click an older post that only exists in page 2.
    const targetPage2Post = postsPage2[0]
    const targetTitle = targetPage2Post.fields.title as string
    const targetSlug = targetPage2Post.fields.id as string
    const targetCategorySlug = (targetPage2Post.fields.category as { fields: { id: string } }).fields.id

    await blog.clickCardByTitle(targetTitle)
    await page.waitForURL(`**/blog/${targetCategorySlug}/${targetSlug}`)
    await expect(detail.title()).toHaveText(targetTitle)

    // 4. Press browser back — RTK Query cache (keepUnusedDataFor = 60s)
    // should keep the merged listing intact instead of refetching from skip=0.
    await page.goBack()
    await page.waitForURL('**/blog')
    await expect(blog.postList()).toBeVisible()
    // Count should match what we had after the scroll (no reset to first page).
    await expect.poll(async () => blog.cards().count(), { timeout: 10_000 }).toBe(afterScrollCount)
  })
})
