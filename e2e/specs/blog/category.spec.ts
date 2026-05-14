import { expect, test } from '@playwright/test'
import { announcementsCategory } from '../../fixtures/blog/categories'
import { mockBlogApi } from '../../mocks/blog'
import { watchUnmockedCmsRequests } from '../../mocks/shared'
import { BlogCategoryPage } from '../../pages/blog.page'

const slug = announcementsCategory.fields.id as string
const title = announcementsCategory.fields.title as string

test.describe('Blog category /blog/:categorySlug', () => {
  let unmocked: { errors: string[] }

  test.beforeEach(({ page }) => {
    unmocked = watchUnmockedCmsRequests(page)
  })

  test.afterEach(() => {
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  })

  test('happy: renders hero and filtered posts when category exists', async ({ page }) => {
    await mockBlogApi(page, { categories: 'happy', postsByCategory: 'happy' })
    const category = new BlogCategoryPage(page)
    await category.goto(slug)
    await expect(category.hero(title)).toBeVisible({ timeout: 15_000 })
    await expect(category.postList()).toBeVisible()
  })

  test('bad path: /blog/categories returns 500 → blog-error visible', async ({ page }) => {
    await mockBlogApi(page, { categories: 'error' })
    const category = new BlogCategoryPage(page)
    await category.goto(slug)
    await expect(category.errorState()).toBeVisible({ timeout: 15_000 })
  })
})
