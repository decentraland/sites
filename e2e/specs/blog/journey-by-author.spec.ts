// See e2e/README.md for the suite's mental model (isolated when/and/should tests).
import { decentralandTeamAuthor } from '../../fixtures/blog/authors'
import { announcementsCategory } from '../../fixtures/blog/categories'
import { featuredPost, gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { BlogAuthorPage, BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

const CATEGORY_SLUG = announcementsCategory.fields.id as string
const START_SLUG = featuredPost.fields.id as string
const START_TITLE = featuredPost.fields.title as string
const AUTHOR_TITLE = decentralandTeamAuthor.fields.title as string
const AUTHOR_SLUG = decentralandTeamAuthor.fields.id as string

test.describe('when a reader on a post detail clicks the author link', () => {
  test('should navigate to the author landing page', async ({ page }) => {
    await mockBlogApi(page, {})
    const detail = new BlogPostDetailPage(page)
    await detail.goto(CATEGORY_SLUG, START_SLUG)
    await expect(detail.title()).toHaveText(START_TITLE)
    await detail.authorLink().click()
    await page.waitForURL(`**/blog/author/${AUTHOR_SLUG}`)
    expect(page.url()).toContain(`/blog/author/${AUTHOR_SLUG}`)
  })
})

test.describe('when a reader lands on an author page', () => {
  let author: BlogAuthorPage

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, {})
    author = new BlogAuthorPage(page)
    await author.goto(AUTHOR_SLUG)
  })

  test('should render the author header with the author name', async () => {
    await expect(author.authorHeading(AUTHOR_TITLE)).toBeVisible()
  })

  test('should render the post list filtered by the author', async () => {
    await expect(author.postList()).toBeVisible()
  })
})

test.describe('when a reader on an author page clicks another post by them', () => {
  test('should navigate to that post detail', async ({ page }) => {
    await mockBlogApi(page, {})
    const author = new BlogAuthorPage(page)
    const detail = new BlogPostDetailPage(page)
    const anotherByAuthor = gridPosts.find(p => {
      const a = p.fields.author as { fields: { id: string } } | undefined
      return a?.fields.id === AUTHOR_SLUG && p.sys.id !== featuredPost.sys.id
    })
    if (!anotherByAuthor) throw new Error('Fixture sanity: need another post by Decentraland Team')
    const otherTitle = anotherByAuthor.fields.title as string
    const otherSlug = anotherByAuthor.fields.id as string
    const otherCategory = (anotherByAuthor.fields.category as { fields: { id: string } }).fields.id

    await author.goto(AUTHOR_SLUG)
    await expect(author.postList()).toBeVisible()
    await author.clickCardByTitle(otherTitle)
    await page.waitForURL(`**/blog/${otherCategory}/${otherSlug}`)
    await expect(detail.title()).toHaveText(otherTitle)
  })
})

test.describe('when /blog/authors fails to load', () => {
  test('should render the friendly error UI on the author page', async ({ page }) => {
    await mockBlogApi(page, { authors: 'error' })
    const author = new BlogAuthorPage(page)
    await author.goto(AUTHOR_SLUG)
    await expect(author.errorState()).toBeVisible()
  })
})

test.describe('when an author has no posts', () => {
  let author: BlogAuthorPage

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, { postsByAuthor: 'empty' })
    author = new BlogAuthorPage(page)
    await author.goto(AUTHOR_SLUG)
  })

  test('should still render the author header', async () => {
    await expect(author.authorHeading(AUTHOR_TITLE)).toBeVisible()
  })

  test('should render no post cards', async () => {
    await expect(author.cards()).toHaveCount(0)
  })

  test('should not render the error UI', async () => {
    await expect(author.errorState()).toHaveCount(0)
  })
})
