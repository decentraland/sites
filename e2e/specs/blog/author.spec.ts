import { expect, test } from '@playwright/test'
import { decentralandTeamAuthor } from '../../fixtures/blog/authors'
import { mockBlogApi } from '../../mocks/blog'
import { watchUnmockedCmsRequests } from '../../mocks/shared'
import { BlogAuthorPage } from '../../pages/blog.page'

const slug = decentralandTeamAuthor.fields.id as string
const title = decentralandTeamAuthor.fields.title as string

test.describe('Blog author /blog/author/:authorSlug', () => {
  let unmocked: { errors: string[] }

  test.beforeEach(({ page }) => {
    unmocked = watchUnmockedCmsRequests(page)
  })

  test.afterEach(() => {
    expect(unmocked.errors, 'Unmocked CMS requests detected').toEqual([])
  })

  test('happy: renders author header and filtered posts when author exists', async ({ page }) => {
    await mockBlogApi(page, { authors: 'happy', postsByAuthor: 'happy' })
    const author = new BlogAuthorPage(page)
    await author.goto(slug)
    await expect(author.authorHeading(title)).toBeVisible({ timeout: 15_000 })
    await expect(author.postList()).toBeVisible()
  })

  test('bad path: /blog/authors returns 500 → blog-error visible', async ({ page }) => {
    await mockBlogApi(page, { authors: 'error' })
    const author = new BlogAuthorPage(page)
    await author.goto(slug)
    await expect(author.errorState()).toBeVisible({ timeout: 15_000 })
  })
})
