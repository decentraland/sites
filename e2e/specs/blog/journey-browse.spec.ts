// See e2e/README.md for the suite's mental model (isolated when/and/should tests).
import { announcementsCategory } from '../../fixtures/blog/categories'
import { featuredPost, gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { BlogCategoryPage, BlogListingPage, BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

const FEATURED_TITLE = featuredPost.fields.title as string
const FEATURED_SLUG = featuredPost.fields.id as string
const CATEGORY_SLUG = announcementsCategory.fields.id as string
const CATEGORY_TITLE = announcementsCategory.fields.title as string

test.describe('when a reader lands on /blog', () => {
  let blog: BlogListingPage

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, {})
    blog = new BlogListingPage(page)
    await blog.goto()
  })

  test('should render the post list', async () => {
    await expect(blog.postList()).toBeVisible()
  })

  test('should render the featured post in the main post card', async () => {
    await expect(blog.mainPostCard()).toContainText(FEATURED_TITLE)
  })
})

test.describe('when a reader on /blog clicks the featured card', () => {
  test('should navigate to the post detail page', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await blog.clickCardByTitle(FEATURED_TITLE)
    await page.waitForURL(`**/blog/${CATEGORY_SLUG}/${FEATURED_SLUG}`)
    expect(page.url()).toContain(`/blog/${CATEGORY_SLUG}/${FEATURED_SLUG}`)
  })
})

test.describe('when a reader is on a post detail page', () => {
  let detail: BlogPostDetailPage

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, {})
    detail = new BlogPostDetailPage(page)
    await detail.goto(CATEGORY_SLUG, FEATURED_SLUG)
    await expect(detail.title()).toHaveText(FEATURED_TITLE)
  })

  test('should render the post title', async () => {
    await expect(detail.title()).toHaveText(FEATURED_TITLE)
  })

  test('should render the post body with the title text', async () => {
    await expect(detail.body()).toContainText(FEATURED_TITLE)
  })

  test('should expose a share intent link pointing to X with the post url', async () => {
    await expect(detail.shareTwitter()).toHaveAttribute('href', new RegExp(`x\\.com/intent/post.*${encodeURIComponent(FEATURED_SLUG)}`))
  })

  test('should expose a share intent link pointing to Facebook with the post url', async () => {
    await expect(detail.shareFacebook()).toHaveAttribute('href', new RegExp(`facebook\\.com/sharer.*${encodeURIComponent(FEATURED_SLUG)}`))
  })

  test('should open share links in a new tab', async () => {
    await expect(detail.shareTwitter()).toHaveAttribute('target', '_blank')
  })

  test('should mark share links as noopener', async () => {
    await expect(detail.shareTwitter()).toHaveAttribute('rel', /noopener/)
  })
})

test.describe('when a reader on a post detail clicks the category meta link', () => {
  test('should navigate to the category landing page', async ({ page }) => {
    await mockBlogApi(page, {})
    const detail = new BlogPostDetailPage(page)
    await detail.goto(CATEGORY_SLUG, FEATURED_SLUG)
    await expect(detail.title()).toHaveText(FEATURED_TITLE)
    await detail.categoryLink().click()
    await page.waitForURL(`**/blog/${CATEGORY_SLUG}`)
    expect(page.url()).toMatch(new RegExp(`/blog/${CATEGORY_SLUG}$`))
  })
})

test.describe('when a reader on a category page clicks another post card', () => {
  test('should navigate to that post detail', async ({ page }) => {
    await mockBlogApi(page, {})
    const category = new BlogCategoryPage(page)
    const detail = new BlogPostDetailPage(page)
    const anotherInCategory = gridPosts.find(p => {
      const cat = p.fields.category as { fields: { id: string } } | undefined
      return cat?.fields.id === CATEGORY_SLUG && p.sys.id !== featuredPost.sys.id
    })
    if (!anotherInCategory) throw new Error('Fixture sanity: need another post in the announcements category')
    const otherTitle = anotherInCategory.fields.title as string
    const otherSlug = anotherInCategory.fields.id as string

    await category.goto(CATEGORY_SLUG)
    await expect(category.postList()).toBeVisible()
    await category.clickCardByTitle(otherTitle)
    await page.waitForURL(`**/blog/${CATEGORY_SLUG}/${otherSlug}`)
    await expect(detail.title()).toHaveText(otherTitle)
  })
})

test.describe('when /blog/posts returns a 500 error', () => {
  let blog: BlogListingPage

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, { posts: 'error' })
    blog = new BlogListingPage(page)
    await blog.goto()
  })

  test('should render the friendly error UI', async () => {
    await expect(blog.errorState()).toBeVisible()
  })

  test('should not render the post list', async () => {
    await expect(blog.postList()).toHaveCount(0)
  })
})

test.describe('when a deep-linked post does not exist in the CMS', () => {
  test('should render the friendly error UI', async ({ page }) => {
    await mockBlogApi(page, { postBySlug: 'not-found' })
    const detail = new BlogPostDetailPage(page)
    await detail.goto('announcements', 'this-slug-does-not-exist')
    await expect(detail.errorState()).toBeVisible()
  })
})

test.describe('when /blog/categories fails but /blog/posts succeeds', () => {
  let blog: BlogListingPage

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, { categories: 'error' })
    blog = new BlogListingPage(page)
    await blog.goto()
  })

  test('should still render the post list', async () => {
    await expect(blog.postList()).toBeVisible()
  })

  test('should still render the post cards', async () => {
    await expect(blog.cards()).not.toHaveCount(0)
  })
})
