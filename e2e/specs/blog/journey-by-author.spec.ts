import { expect, test } from '@playwright/test'
import { decentralandTeamAuthor } from '../../fixtures/blog/authors'
import { announcementsCategory } from '../../fixtures/blog/categories'
import { featuredPost, gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { watchUnmockedCmsRequests } from '../../mocks/shared'
import { BlogAuthorPage, BlogPostDetailPage } from '../../pages/blog.page'

// Flow: a user lands on a deep-linked post (worst case for cold lazy load),
// clicks the author link, browses other posts by that author, and opens one.

test.describe('User journey: browse by author', () => {
  let unmocked: { errors: string[] }

  test.beforeEach(({ page }) => {
    unmocked = watchUnmockedCmsRequests(page)
  })

  test.afterEach(() => {
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  })

  test('jumps from a post into the author page and opens another post', async ({ page }) => {
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
    await expect(detail.title()).toHaveText(startTitle, { timeout: 15_000 })

    // 2. Click the author link in the post header.
    await detail.authorLink(authorTitle).click()
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

  test('shows the error state when /blog/authors returns 500', async ({ page }) => {
    await mockBlogApi(page, { authors: 'error' })
    const author = new BlogAuthorPage(page)
    await author.goto(decentralandTeamAuthor.fields.id as string)
    await expect(author.errorState()).toBeVisible({ timeout: 15_000 })
  })
})
