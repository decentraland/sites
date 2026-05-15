import { expect, test } from '@playwright/test'
import { featuredPost } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { watchUnmockedCmsRequests } from '../../mocks/shared'
import { BlogListingPage } from '../../pages/blog.page'

test.describe('Blog listing /blog', () => {
  let unmocked: { errors: string[] }

  test.beforeEach(({ page }) => {
    unmocked = watchUnmockedCmsRequests(page)
  })

  test.afterEach(() => {
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  })

  test('happy: renders featured post + grid cards from CMS', async ({ page }) => {
    await mockBlogApi(page, { posts: 'happy' })
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible({ timeout: 15_000 })
    // Featured post renders inside MainPostCard once `isBigScreen` stabilises.
    // 7 posts in page-1 fixture: 1 featured (main-post-card) + 6 grid (post-card).
    await expect.poll(async () => await blog.mainPostCard().count(), { timeout: 10_000 }).toBe(1)
    await expect(blog.mainPostCard()).toContainText(featuredPost.fields.title as string)
    await expect(blog.cards()).toHaveCount(6)
  })

  test('bad path: /blog/posts returns 500 → blog-error visible', async ({ page }) => {
    await mockBlogApi(page, { posts: 'error' })
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.errorState()).toBeVisible({ timeout: 15_000 })
  })

  test('bad path: empty list → no post-list nor skeleton (UI gap TODO)', async ({ page }) => {
    // TODO: when an explicit empty UI is designed in src/pages/blog/BlogPage.tsx,
    // replace this assertion with a positive check for the empty state testid.
    await mockBlogApi(page, { posts: 'empty' })
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.errorState()).toHaveCount(0)
    await expect(blog.postList()).toHaveCount(0)
    await expect(blog.postListSkeleton()).toHaveCount(0)
  })
})
