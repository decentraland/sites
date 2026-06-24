// See e2e/README.md for the suite's mental model (spec = user journey).
import { decentralandTeamAuthor } from '../../fixtures/blog/authors'
import { announcementsCategory } from '../../fixtures/blog/categories'
import { featuredPost, gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { BlogAuthorPage, BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

test.describe('Browsing by author', () => {
  test('a reader can click the author of a post and open another post by them', async ({ page }) => {
    await mockBlogApi(page, {})
    const detail = new BlogPostDetailPage(page)
    const author = new BlogAuthorPage(page)

    const categorySlug = announcementsCategory.fields.id as string
    const startSlug = featuredPost.fields.id as string
    const startTitle = featuredPost.fields.title as string
    const authorTitle = decentralandTeamAuthor.fields.title as string
    const authorSlug = decentralandTeamAuthor.fields.id as string

    // 1. Land on the featured post directly to validate the deep-link path.
    await detail.goto(categorySlug, startSlug)
    await expect(detail.title()).toHaveText(startTitle)

    // 2. Click the author link in the post header.
    await detail.authorLink().click()
    await page.waitForURL(`**/blog/author/${authorSlug}`)
    await expect(author.authorHeading(authorTitle)).toBeVisible()
    await expect(author.postList()).toBeVisible()

    // 3. Open another post by the same author. Pick one that is NOT the
    // starting post so the navigation actually changes.
    const anotherByAuthor = gridPosts.find(p => {
      const a = p.fields.author as { fields: { id: string } } | undefined
      return a?.fields.id === authorSlug && p.sys.id !== featuredPost.sys.id
    })
    if (!anotherByAuthor) throw new Error('Fixture sanity: need another post by Decentraland Team')
    const otherTitle = anotherByAuthor.fields.title as string
    const otherSlug = anotherByAuthor.fields.id as string
    const otherCategory = (anotherByAuthor.fields.category as { fields: { id: string } }).fields.id

    await author.clickCardByTitle(otherTitle)
    await page.waitForURL(`**/blog/${otherCategory}/${otherSlug}`)
    await expect(detail.title()).toHaveText(otherTitle)
  })

  test('when the author page fails to load, the reader sees a friendly error', async ({ page }) => {
    await mockBlogApi(page, { authors: 'error' })
    const author = new BlogAuthorPage(page)
    await author.goto(decentralandTeamAuthor.fields.id as string)
    await expect(author.errorState()).toBeVisible()
  })

  test('when an author has no posts, the reader still sees the header (no error UI)', async ({ page }) => {
    await mockBlogApi(page, { postsByAuthor: 'empty' })
    const author = new BlogAuthorPage(page)
    await author.goto(decentralandTeamAuthor.fields.id as string)
    await expect(author.authorHeading(decentralandTeamAuthor.fields.title as string)).toBeVisible()
    await expect(author.cards()).toHaveCount(0)
    await expect(author.errorState()).toHaveCount(0)
  })
})
