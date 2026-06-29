// See e2e/README.md for the suite's mental model (isolated when/and/should tests).
import { eventsCategory } from '../../fixtures/blog/categories'
import { gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { BlogCategoryPage, BlogListingPage, BlogNavbar, BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

const CATEGORY_SLUG = eventsCategory.fields.id as string
const CATEGORY_TITLE = eventsCategory.fields.title as string

test.describe('when a reader on /blog picks a category from the navbar', () => {
  test('should navigate to the category landing page', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    await blog.goto()
    await expect(blog.postList()).toBeVisible()
    await expect(navbar.categoryLink(CATEGORY_TITLE)).toBeVisible()
    await navbar.categoryLink(CATEGORY_TITLE).click()
    await page.waitForURL(`**/blog/${CATEGORY_SLUG}`)
    expect(page.url()).toMatch(new RegExp(`/blog/${CATEGORY_SLUG}$`))
  })
})

test.describe('when a reader lands on a category page', () => {
  let category: BlogCategoryPage

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, {})
    category = new BlogCategoryPage(page)
    await category.goto(CATEGORY_SLUG)
  })

  test('should render the category hero with the category title', async () => {
    await expect(category.hero(CATEGORY_TITLE)).toBeVisible()
  })

  test('should render the filtered post list', async () => {
    await expect(category.postList()).toBeVisible()
  })
})

test.describe('when a reader on a category page clicks a post card', () => {
  test('should navigate to that post detail', async ({ page }) => {
    await mockBlogApi(page, {})
    const category = new BlogCategoryPage(page)
    const detail = new BlogPostDetailPage(page)
    const inCategory = gridPosts.find(p => {
      const cat = p.fields.category as { fields: { id: string } } | undefined
      return cat?.fields.id === CATEGORY_SLUG
    })
    if (!inCategory) throw new Error('Fixture sanity: need a post in the events category')
    const postTitle = inCategory.fields.title as string
    const postSlug = inCategory.fields.id as string

    await category.goto(CATEGORY_SLUG)
    await expect(category.postList()).toBeVisible()
    await category.clickCardByTitle(postTitle)
    await page.waitForURL(`**/blog/${CATEGORY_SLUG}/${postSlug}`)
    await expect(detail.title()).toHaveText(postTitle)
  })
})

test.describe('when a reader on a category page clicks the all-articles link', () => {
  test('should navigate back to /blog', async ({ page }) => {
    await mockBlogApi(page, {})
    const category = new BlogCategoryPage(page)
    const navbar = new BlogNavbar(page)
    const blog = new BlogListingPage(page)

    await category.goto(CATEGORY_SLUG)
    await expect(category.hero(CATEGORY_TITLE)).toBeVisible()
    await expect(navbar.allArticles()).toBeVisible()
    await navbar.allArticles().click()
    await page.waitForURL('**/blog')
    await expect(blog.postList()).toBeVisible()
  })
})

test.describe('when /blog/categories fails to load', () => {
  test('should render the friendly error UI on the category page', async ({ page }) => {
    await mockBlogApi(page, { categories: 'error' })
    const category = new BlogCategoryPage(page)
    await category.goto(CATEGORY_SLUG)
    await expect(category.errorState()).toBeVisible()
  })
})

test.describe('when a category has no posts', () => {
  let category: BlogCategoryPage

  test.beforeEach(async ({ page }) => {
    await mockBlogApi(page, { postsByCategory: 'empty' })
    category = new BlogCategoryPage(page)
    await category.goto(CATEGORY_SLUG)
  })

  test('should still render the category hero', async () => {
    await expect(category.hero(CATEGORY_TITLE)).toBeVisible()
  })

  test('should render no post cards', async () => {
    await expect(category.cards()).toHaveCount(0)
  })

  test('should not render the error UI', async () => {
    await expect(category.errorState()).toHaveCount(0)
  })
})
