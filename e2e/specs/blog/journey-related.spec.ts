// See e2e/README.md for the suite's mental model (isolated when/and/should tests).
import { announcementsCategory } from '../../fixtures/blog/categories'
import { featuredPost, gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

const CATEGORY_SLUG = announcementsCategory.fields.id as string
const START_SLUG = featuredPost.fields.id as string
const START_TITLE = featuredPost.fields.title as string

test.describe('when a reader is on a post detail with related posts available', () => {
  let detail: BlogPostDetailPage

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, {})
    detail = new BlogPostDetailPage(page)
    await detail.goto(CATEGORY_SLUG, START_SLUG)
    await expect(detail.title()).toHaveText(START_TITLE)
  })

  test('should render the related-posts section', async () => {
    await expect(detail.relatedPosts()).toBeVisible()
  })

  test('should render at least one related card', async () => {
    await expect.poll(async () => detail.relatedCards().count()).toBeGreaterThanOrEqual(1)
  })

  test('should exclude the current post from the related list', async () => {
    await expect(detail.relatedCards().filter({ hasText: START_TITLE })).toHaveCount(0)
  })
})

test.describe('when a reader on a post detail clicks one of the related cards', () => {
  test('should navigate to that related post detail', async ({ page }) => {
    await mockBlogApi(page, {})
    const detail = new BlogPostDetailPage(page)
    const target = gridPosts.find(p => {
      const cat = p.fields.category as { fields: { id: string } } | undefined
      return cat?.fields.id === CATEGORY_SLUG && p.sys.id !== featuredPost.sys.id
    })
    if (!target) throw new Error('Fixture sanity: need another announcements post for related')
    const targetTitle = target.fields.title as string
    const targetSlug = target.fields.id as string

    await detail.goto(CATEGORY_SLUG, START_SLUG)
    await expect(detail.relatedPosts()).toBeVisible()
    await detail.relatedCards().first().getByRole('link', { name: targetTitle }).first().click()
    await page.waitForURL(`**/blog/${CATEGORY_SLUG}/${targetSlug}`)
    await expect(detail.title()).toHaveText(targetTitle)
  })
})
