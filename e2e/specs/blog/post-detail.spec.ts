import { expect, test } from '@playwright/test'
import { announcementsCategory } from '../../fixtures/blog/categories'
import { detailPost } from '../../fixtures/blog/post-detail'
import { mockBlogApi } from '../../mocks/blog'
import { watchUnmockedCmsRequests } from '../../mocks/shared'
import { BlogPostDetailPage } from '../../pages/blog.page'

const categorySlug = announcementsCategory.fields.id as string
const postSlug = detailPost.fields.id as string

test.describe('Blog post detail /blog/:cat/:slug', () => {
  let unmocked: { errors: string[] }

  test.beforeEach(({ page }) => {
    unmocked = watchUnmockedCmsRequests(page)
  })

  test.afterEach(() => {
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  })

  test('happy: renders post title and body when CMS returns matching slug', async ({ page }) => {
    await mockBlogApi(page, { postBySlug: 'happy' })
    const detail = new BlogPostDetailPage(page)
    await detail.goto(categorySlug, postSlug)
    await expect(detail.title()).toHaveText(detailPost.fields.title as string, { timeout: 15_000 })
  })

  test('bad path: slug not found in CMS → blog-error visible', async ({ page }) => {
    await mockBlogApi(page, { postBySlug: 'not-found' })
    const detail = new BlogPostDetailPage(page)
    await detail.goto(categorySlug, 'this-slug-does-not-exist')
    await expect(detail.errorState()).toBeVisible({ timeout: 15_000 })
  })

  test('bad path: /blog/posts?slug returns 500 → blog-error visible', async ({ page }) => {
    await mockBlogApi(page, { postBySlug: 'error' })
    const detail = new BlogPostDetailPage(page)
    await detail.goto(categorySlug, postSlug)
    await expect(detail.errorState()).toBeVisible({ timeout: 15_000 })
  })
})
