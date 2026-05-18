import { expect, test } from '@playwright/test'
import { announcementsCategory } from '../../fixtures/blog/categories'
import { featuredPost, gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { watchUnmockedCmsRequests } from '../../mocks/shared'
import { BlogCategoryPage, BlogListingPage, BlogPostDetailPage } from '../../pages/blog.page'

// Flow: a user lands on /blog, opens the featured post, jumps from the post
// detail into its category, and opens another post from the filtered list.
// Every navigation step is a real click — no direct `page.goto` to deep links
// except the initial landing.

test.describe('User journey: browse blog', () => {
  let unmocked: { errors: string[] }

  test.beforeEach(({ page }) => {
    unmocked = watchUnmockedCmsRequests(page)
  })

  test.afterEach(() => {
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  })

  test('opens a post from the listing and walks back into its category', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const detail = new BlogPostDetailPage(page)
    const category = new BlogCategoryPage(page)

    const featuredTitle = featuredPost.fields.title as string
    const featuredSlug = featuredPost.fields.id as string
    const categoryTitle = announcementsCategory.fields.title as string
    const categorySlug = announcementsCategory.fields.id as string

    // 1. Land on /blog and confirm the listing renders.
    await blog.goto()
    await expect(blog.postList()).toBeVisible({ timeout: 15_000 })
    await expect(blog.mainPostCard()).toContainText(featuredTitle)

    // 2. Click the featured card and confirm we navigate to its detail page.
    await blog.clickCardByTitle(featuredTitle)
    await page.waitForURL(`**/blog/${categorySlug}/${featuredSlug}`)
    await expect(detail.title()).toHaveText(featuredTitle)
    // The body must render — guards against RichText regressions that would
    // ship a blank detail page.
    await expect(detail.body().first()).toBeVisible()

    // 3. From the post header, click the category meta link.
    await detail.categoryLink(categoryTitle).click()
    await page.waitForURL(`**/blog/${categorySlug}`)
    await expect(category.hero(categoryTitle)).toBeVisible()
    await expect(category.postList()).toBeVisible()

    // 4. Pick another post from the filtered list and confirm we land on it.
    // Use a different post in the same category to validate the filter.
    const anotherInCategory = gridPosts.find(p => {
      const cat = p.fields.category as { fields: { id: string } } | undefined
      return cat?.fields.id === categorySlug && p.sys.id !== featuredPost.sys.id
    })
    if (!anotherInCategory) throw new Error('Fixture sanity: need another post in the announcements category')
    const otherTitle = anotherInCategory.fields.title as string
    const otherSlug = anotherInCategory.fields.id as string

    await category.clickCardByTitle(otherTitle)
    await page.waitForURL(`**/blog/${categorySlug}/${otherSlug}`)
    await expect(detail.title()).toHaveText(otherTitle)
  })

  test('shows the error state when /blog/posts returns 500', async ({ page }) => {
    await mockBlogApi(page, { posts: 'error' })
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.errorState()).toBeVisible({ timeout: 15_000 })
    // Sanity: no card content leaked through behind the error.
    await expect(blog.postList()).toHaveCount(0)
  })

  test('shows the error state when a deep-linked post does not exist', async ({ page }) => {
    await mockBlogApi(page, { postBySlug: 'not-found' })
    const detail = new BlogPostDetailPage(page)
    await detail.goto('announcements', 'this-slug-does-not-exist')
    await expect(detail.errorState()).toBeVisible({ timeout: 15_000 })
  })
})
