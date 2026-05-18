import { expect, test } from '@playwright/test'
import { eventsCategory } from '../../fixtures/blog/categories'
import { gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { watchUnmockedCmsRequests } from '../../mocks/shared'
import { BlogCategoryPage, BlogListingPage, BlogNavbar, BlogPostDetailPage } from '../../pages/blog.page'

// Flow: a user lands on /blog, picks a category from the navbar, sees the
// category hero plus filtered posts, and opens one of them.
// This exercises the BlogNavigation top bar which is rendered on every blog
// page — a regression there would break navigation across the whole feature.

test.describe('User journey: browse by category', () => {
  let unmocked: { errors: string[] }

  test.beforeEach(({ page }) => {
    unmocked = watchUnmockedCmsRequests(page)
  })

  test.afterEach(() => {
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  })

  test('navigates to a category from the navbar and opens a post in it', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    const category = new BlogCategoryPage(page)
    const detail = new BlogPostDetailPage(page)

    const categoryTitle = eventsCategory.fields.title as string
    const categorySlug = eventsCategory.fields.id as string

    // 1. Land on /blog so the lazy chunk has booted before we start clicking.
    await blog.goto()
    await expect(blog.postList()).toBeVisible({ timeout: 15_000 })

    // 2. Click the category link in the navbar.
    await navbar.categoryLink(categoryTitle).click()
    await page.waitForURL(`**/blog/${categorySlug}`)
    await expect(category.hero(categoryTitle)).toBeVisible()
    await expect(category.postList()).toBeVisible()

    // 3. Open a post that actually belongs to the selected category.
    const inCategory = gridPosts.find(p => {
      const cat = p.fields.category as { fields: { id: string } } | undefined
      return cat?.fields.id === categorySlug
    })
    if (!inCategory) throw new Error('Fixture sanity: need a post in the events category')
    const postTitle = inCategory.fields.title as string
    const postSlug = inCategory.fields.id as string

    await category.clickCardByTitle(postTitle)
    await page.waitForURL(`**/blog/${categorySlug}/${postSlug}`)
    await expect(detail.title()).toHaveText(postTitle)
    await expect(detail.body().first()).toBeVisible()
  })

  test('shows the error state when /blog/categories returns 500', async ({ page }) => {
    await mockBlogApi(page, { categories: 'error' })
    const category = new BlogCategoryPage(page)
    await category.goto(eventsCategory.fields.id as string)
    await expect(category.errorState()).toBeVisible({ timeout: 15_000 })
  })
})
