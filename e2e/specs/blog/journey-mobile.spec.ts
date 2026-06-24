// See e2e/README.md for the suite's mental model (isolated when/and/should tests).
import { featuredPost, gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { BlogListingPage, BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

// `useMobileMediaQuery` flips below ~md (around 900px). BlogPage passes
// `hasMainPost={!isMobile}`, so on a phone viewport the featured slot must
// collapse and every post lives in the grid. We use a representative modern
// Android viewport (Pixel 7).
test.use({ viewport: { width: 390, height: 844 } })

const FEATURED_TITLE = featuredPost.fields.title as string
const FEATURED_SLUG = featuredPost.fields.id as string

test.describe('when a reader lands on /blog from a mobile viewport', () => {
  let blog: BlogListingPage

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, {})
    blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
  })

  test('should not render the desktop main post card', async () => {
    await expect(blog.mainPostCard()).toHaveCount(0)
  })

  test('should render every post in the grid (no featured slot)', async () => {
    await expect.poll(async () => blog.cards().count()).toBeGreaterThanOrEqual(gridPosts.length + 1)
  })
})

test.describe('when a mobile reader taps a card on /blog', () => {
  test('should navigate to that post detail', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const detail = new BlogPostDetailPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await blog.clickCardByTitle(FEATURED_TITLE)
    await page.waitForURL(`**/${FEATURED_SLUG}`)
    await expect(detail.title()).toHaveText(FEATURED_TITLE)
  })
})
