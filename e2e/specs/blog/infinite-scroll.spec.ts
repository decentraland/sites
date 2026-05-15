import { expect, test } from '@playwright/test'
import { mockBlogApi } from '../../mocks/blog'
import { watchUnmockedCmsRequests } from '../../mocks/shared'
import { BlogListingPage } from '../../pages/blog.page'

test.describe('Blog infinite scroll /blog', () => {
  let unmocked: { errors: string[] }

  test.beforeEach(({ page }) => {
    unmocked = watchUnmockedCmsRequests(page)
  })

  test.afterEach(() => {
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  })

  test('happy: scrolling triggers skip>0 fetch and appends posts without duplicates', async ({ page }) => {
    await mockBlogApi(page, { posts: 'multi-page', postsDelayMs: 100 })
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible({ timeout: 15_000 })
    const initialCount = await blog.cards().count()
    expect(initialCount).toBeGreaterThan(0)

    // useInfiniteScroll from @dcl/hooks listens on window scroll; trigger a
    // load-more by scrolling the document to the bottom and wait for the
    // second-page request to fire.
    const page2Request = page.waitForRequest(req => {
      try {
        const u = new URL(req.url())
        if (!u.pathname.endsWith('/blog/posts')) return false
        const skip = Number(u.searchParams.get('skip') ?? '0')
        return skip > 0
      } catch {
        return false
      }
    })

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page2Request

    // Assert the rendered card count grew. We poll because RTK Query merge
    // happens after onQueryStarted dispatches into the entity adapter.
    await expect.poll(async () => await blog.cards().count(), { timeout: 15_000 }).toBeGreaterThan(initialCount)

    // Each rendered card is a unique React node with a stable key (post.id).
    // We assert no duplicate post slugs by counting cards that share a title.
    // Reading the title link `href` from each card (image+title anchors share
    // the same href; we dedupe per card).
    const cardHrefs = await blog.cards().evaluateAll(cards =>
      cards.map(card => {
        const anchor = card.querySelector('a[href^="/blog/"]') as HTMLAnchorElement | null
        return anchor?.getAttribute('href') ?? ''
      })
    )
    expect(new Set(cardHrefs).size).toBe(cardHrefs.length)
  })

  test('bad path: page 2 fetch fails → page 1 stays visible', async ({ page }) => {
    // TODO: there is no dedicated UI for a page-2-only error today; this
    // asserts the first page remains untouched, which is the existing
    // behavior. Update when an inline error/banner is added.
    await mockBlogApi(page, { posts: 'multi-page', postsPage2: 'error', postsDelayMs: 100 })
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible({ timeout: 15_000 })
    const initialCount = await blog.cards().count()
    expect(initialCount).toBeGreaterThan(0)

    // Register waiter BEFORE the scroll so we don't miss the request
    const page2Request = page.waitForRequest(req => {
      try {
        const u = new URL(req.url())
        return u.pathname.endsWith('/blog/posts') && Number(u.searchParams.get('skip') ?? '0') > 0
      } catch {
        return false
      }
    })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page2Request
    await expect.poll(async () => await blog.cards().count(), { timeout: 5_000 }).toBe(initialCount)
  })
})
