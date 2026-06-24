// See e2e/README.md for the suite's mental model (isolated when/and/should tests).
import { postsPage2 } from '../../fixtures/blog/posts-page-2'
import { mockBlogApi } from '../../mocks/blog'
import { BlogListingPage, BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

const PAGE_2_POST = postsPage2[0]
const PAGE_2_TITLE = PAGE_2_POST.fields.title as string
const PAGE_2_SLUG = PAGE_2_POST.fields.id as string
const PAGE_2_CATEGORY = (PAGE_2_POST.fields.category as { fields: { id: string } }).fields.id

test.describe('when a reader on /blog scrolls past the first page of posts', () => {
  test('should fetch a second page with skip > 0', async ({ page }) => {
    await mockBlogApi(page, { posts: 'multi-page' })
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()

    const page2Request = page.waitForRequest(req => {
      try {
        const u = new URL(req.url())
        if (!u.pathname.endsWith('/blog/posts')) return false
        return Number(u.searchParams.get('skip') ?? '0') > 0
      } catch {
        return false
      }
    })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page2Request
  })

  test('should append new cards without dropping the first page', async ({ page }) => {
    await mockBlogApi(page, { posts: 'multi-page' })
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    const initialCount = await blog.cards().count()
    expect(initialCount).toBeGreaterThan(0)

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect.poll(async () => blog.cards().count()).toBeGreaterThan(initialCount)
  })
})

test.describe('when a reader clicks a card that only exists in the second page', () => {
  test('should navigate to its detail page', async ({ page }) => {
    await mockBlogApi(page, { posts: 'multi-page' })
    const blog = new BlogListingPage(page)
    const detail = new BlogPostDetailPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(blog.cardByTitle(PAGE_2_TITLE)).toBeVisible()

    await blog.clickCardByTitle(PAGE_2_TITLE)
    await page.waitForURL(`**/blog/${PAGE_2_CATEGORY}/${PAGE_2_SLUG}`)
    await expect(detail.title()).toHaveText(PAGE_2_TITLE)
  })
})

test.describe('when a reader presses back from a deep-page-2 post', () => {
  test('should keep the page-2 card visible on /blog (cache hit)', async ({ page }) => {
    await mockBlogApi(page, { posts: 'multi-page' })
    const blog = new BlogListingPage(page)
    const detail = new BlogPostDetailPage(page)

    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(blog.cardByTitle(PAGE_2_TITLE)).toBeVisible()
    await blog.clickCardByTitle(PAGE_2_TITLE)
    await page.waitForURL(`**/blog/${PAGE_2_CATEGORY}/${PAGE_2_SLUG}`)
    await expect(detail.title()).toHaveText(PAGE_2_TITLE)

    await page.goBack()
    await page.waitForURL('**/blog')
    await expect(blog.cardByTitle(PAGE_2_TITLE)).toBeVisible()
  })
})
