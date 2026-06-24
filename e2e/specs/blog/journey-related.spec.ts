// See e2e/README.md for the suite's mental model (spec = user journey).
import { announcementsCategory } from '../../fixtures/blog/categories'
import { featuredPost, gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

test.describe('Reading related posts', () => {
  test('a reader on a post can pick one of the related posts and read that one too', async ({ page }) => {
    await mockBlogApi(page, {})
    const detail = new BlogPostDetailPage(page)

    const categorySlug = announcementsCategory.fields.id as string
    const startSlug = featuredPost.fields.id as string
    const startTitle = featuredPost.fields.title as string

    // 1. Deep-link into the featured post.
    await detail.goto(categorySlug, startSlug)
    await expect(detail.title()).toHaveText(startTitle)

    // 2. The related-posts section must render with at least one card. The
    // useGetBlogPostsQuery({ category }) inside PostPage filters the current
    // post out of its own related list, so we need >=2 fixtures in the
    // announcements category — verified at the fixture layer below.
    const sameCategoryOthers = gridPosts.filter(p => {
      const cat = p.fields.category as { fields: { id: string } } | undefined
      return cat?.fields.id === categorySlug && p.sys.id !== featuredPost.sys.id
    })
    if (sameCategoryOthers.length === 0) {
      throw new Error('Fixture sanity: need >=1 other announcements post for related to render')
    }

    await expect(detail.relatedPosts()).toBeVisible()
    await expect.poll(async () => detail.relatedCards().count()).toBeGreaterThanOrEqual(1)

    // The current post must NOT appear in its own related list.
    await expect(detail.relatedCards().filter({ hasText: startTitle })).toHaveCount(0)

    // 3. Click the first related card and confirm we navigate.
    const targetTitle = sameCategoryOthers[0].fields.title as string
    const targetSlug = sameCategoryOthers[0].fields.id as string
    await detail.relatedCards().first().getByRole('link', { name: targetTitle }).first().click()
    await page.waitForURL(`**/blog/${categorySlug}/${targetSlug}`)
    await expect(detail.title()).toHaveText(targetTitle)
  })
})
