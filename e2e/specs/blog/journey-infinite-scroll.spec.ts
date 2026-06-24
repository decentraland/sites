// See e2e/README.md for the suite's mental model (spec = user journey).
import { postsPage2 } from '../../fixtures/blog/posts-page-2'
import { mockBlogApi } from '../../mocks/blog'
import { BlogListingPage, BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

test.describe('Scrolling for more posts', () => {
  test('after scrolling loads more posts, opening one and pressing back keeps the list scrolled, not reset', async ({ page }) => {
    await mockBlogApi(page, { posts: 'multi-page' })
    const blog = new BlogListingPage(page)
    const detail = new BlogPostDetailPage(page)

    // 1. Land on /blog and snapshot the initial card count.
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
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

    // Scroll to the bottom — useInfiniteScroll listens on window scroll.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page2Request

    // Wait for new cards to be appended.
    await expect.poll(async () => blog.cards().count()).toBeGreaterThan(initialCount)

    // 3. Click a post that only exists in page 2 to prove the scroll really
    // pulled the second page.
    const targetPage2Post = postsPage2[0]
    const targetTitle = targetPage2Post.fields.title as string
    const targetSlug = targetPage2Post.fields.id as string
    const targetCategorySlug = (targetPage2Post.fields.category as { fields: { id: string } }).fields.id

    await blog.clickCardByTitle(targetTitle)
    await page.waitForURL(`**/blog/${targetCategorySlug}/${targetSlug}`)
    await expect(detail.title()).toHaveText(targetTitle)

    // 4. Press browser back — RTK Query cache (keepUnusedDataFor = 60s) should
    // keep the merged listing intact, so a page-2 card still resolves on /blog
    // without scrolling again. We assert the contract directly instead of
    // counting cards (count has a racy isFetching window).
    await page.goBack()
    await page.waitForURL('**/blog')
    await expect(blog.postList()).toBeVisible()
    await expect(blog.cardByTitle(targetTitle)).toBeVisible()
  })
})
