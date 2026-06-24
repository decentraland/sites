// See e2e/README.md for the suite's mental model (spec = user journey).
import { announcementsCategory } from '../../fixtures/blog/categories'
import { featuredPost, gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { BlogCategoryPage, BlogListingPage, BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

test.describe('Browsing the blog', () => {
  test('a reader can open the featured post and jump to other posts in the same category', async ({ page }) => {
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
    await expect(blog.postList()).toBeVisible()
    await expect(blog.mainPostCard()).toContainText(featuredTitle)

    // 2. Click the featured card and confirm we navigate to its detail page.
    await blog.clickCardByTitle(featuredTitle)
    await page.waitForURL(`**/blog/${categorySlug}/${featuredSlug}`)
    await expect(detail.title()).toHaveText(featuredTitle)
    // The body must render real text — guards against RichText regressions
    // that would ship a blank detail page (the default factory body wraps
    // the title in a paragraph).
    await expect(detail.body()).toContainText(featuredTitle)

    // 3. From the post header, click the category meta link.
    await detail.categoryLink().click()
    await page.waitForURL(`**/blog/${categorySlug}`)
    await expect(category.hero(categoryTitle)).toBeVisible()
    await expect(category.postList()).toBeVisible()

    // 4. Pick another post from the filtered list and confirm we land on it.
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

  test('when the post list fails to load, the reader sees a friendly error', async ({ page }) => {
    await mockBlogApi(page, { posts: 'error' })
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.errorState()).toBeVisible()
    await expect(blog.postList()).toHaveCount(0)
  })

  test('when a deep-linked post does not exist, the reader sees a friendly error', async ({ page }) => {
    await mockBlogApi(page, { postBySlug: 'not-found' })
    const detail = new BlogPostDetailPage(page)
    await detail.goto('announcements', 'this-slug-does-not-exist')
    await expect(detail.errorState()).toBeVisible()
  })

  test('when the category dropdown fails but posts load, the listing still works', async ({ page }) => {
    // Partial CMS failure scenario: /blog/categories returns 500, posts work.
    // Should NOT crash the whole page — the listing must still render.
    await mockBlogApi(page, { categories: 'error' })
    const blog = new BlogListingPage(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    // Listing itself is fine — only the navbar category links are absent.
    await expect(blog.cards()).not.toHaveCount(0)
  })

  test('the post detail exposes share intent links for X and Facebook', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const detail = new BlogPostDetailPage(page)

    const featuredTitle = featuredPost.fields.title as string
    const featuredSlug = featuredPost.fields.id as string

    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await blog.clickCardByTitle(featuredTitle)
    await page.waitForURL(`**/blog/${announcementsCategory.fields.id}/${featuredSlug}`)

    const twitter = detail.shareTwitter()
    await expect(twitter).toBeVisible()
    await expect(twitter).toHaveAttribute('href', /x\.com\/intent\/post/)
    await expect(twitter).toHaveAttribute('href', new RegExp(encodeURIComponent(featuredSlug)))
    await expect(twitter).toHaveAttribute('target', '_blank')
    await expect(twitter).toHaveAttribute('rel', /noopener/)

    const facebook = detail.shareFacebook()
    await expect(facebook).toBeVisible()
    await expect(facebook).toHaveAttribute('href', /facebook\.com\/sharer/)
    await expect(facebook).toHaveAttribute('href', new RegExp(encodeURIComponent(featuredSlug)))
    await expect(facebook).toHaveAttribute('target', '_blank')
    await expect(facebook).toHaveAttribute('rel', /noopener/)
  })
})
