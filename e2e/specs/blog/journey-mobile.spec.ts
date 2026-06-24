// See e2e/README.md for the suite's mental model (spec = user journey).
import { featuredPost, gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { BlogListingPage, BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

// `useMobileMediaQuery` flips below ~md (around 900px). BlogPage passes
// `hasMainPost={!isMobile}`, so on a phone viewport the featured card must
// NOT render and every post lives in the grid. We use a representative
// modern Android viewport (Pixel 7).
test.use({ viewport: { width: 390, height: 844 } })

test.describe('Browsing the blog on a phone', () => {
  test('on mobile, every post is a grid card (no oversized featured) and tapping one opens it', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const detail = new BlogPostDetailPage(page)

    await blog.goto()
    await expect(blog.postList()).toBeVisible()

    // The featured-card slot must collapse on mobile.
    await expect(blog.mainPostCard()).toHaveCount(0)

    // Every post (including the would-be featured one) shows up in the grid.
    await expect.poll(async () => blog.cards().count()).toBeGreaterThanOrEqual(gridPosts.length + 1)

    // Tap the would-be featured post and confirm navigation works on mobile.
    const featuredTitle = featuredPost.fields.title as string
    const featuredSlug = featuredPost.fields.id as string
    await blog.clickCardByTitle(featuredTitle)
    await page.waitForURL(`**/${featuredSlug}`)
    await expect(detail.title()).toHaveText(featuredTitle)
  })
})
