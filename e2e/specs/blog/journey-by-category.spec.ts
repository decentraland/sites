// See e2e/README.md for the suite's mental model (spec = user journey).
import { eventsCategory } from '../../fixtures/blog/categories'
import { gridPosts } from '../../fixtures/blog/posts-page-1'
import { mockBlogApi } from '../../mocks/blog'
import { BlogCategoryPage, BlogListingPage, BlogNavbar, BlogPostDetailPage } from '../../pages/blog.page'
import { expect, test } from './_setup'

test.describe('Browsing by category', () => {
  test('a reader can pick a category from the menu and open one of its posts', async ({ page }) => {
    await mockBlogApi(page, {})
    const blog = new BlogListingPage(page)
    const navbar = new BlogNavbar(page)
    const category = new BlogCategoryPage(page)
    const detail = new BlogPostDetailPage(page)

    const categoryTitle = eventsCategory.fields.title as string
    const categorySlug = eventsCategory.fields.id as string

    // 1. Land on /blog so the lazy chunk has booted before we start clicking.
    await blog.goto()
    await expect(blog.postList()).toBeVisible()

    // 2. Wait for the navbar category links to materialise — they depend on
    // /blog/categories resolving, which is a separate fetch from the posts
    // list. Clicking before the link mounts races in CI cold loads.
    await expect(navbar.categoryLink(categoryTitle)).toBeVisible()

    // 3. Click the category link in the navbar.
    await navbar.categoryLink(categoryTitle).click()
    await page.waitForURL(`**/blog/${categorySlug}`)
    await expect(category.hero(categoryTitle)).toBeVisible()
    await expect(category.postList()).toBeVisible()

    // 4. Open a post that actually belongs to the selected category.
    const inCategory = gridPosts.find(p => {
      const cat = p.fields.category as { fields: { id: string } } | undefined
      return cat?.fields.id === categorySlug
    })
    if (!inCategory) throw new Error('Fixture sanity: need a post in the events category')
    const postTitle = inCategory.fields.title as string
    const postSlug = inCategory.fields.id as string

    await category.clickCardByTitle(postTitle)
    await page.waitForURL(`**/blog/${categorySlug}/${postSlug}`)
    await expect(detail.title()).toHaveText(postTitle)
    await expect(detail.body()).toContainText(postTitle)
  })

  test('when the category fails to load, the reader sees a friendly error', async ({ page }) => {
    await mockBlogApi(page, { categories: 'error' })
    const category = new BlogCategoryPage(page)
    await category.goto(eventsCategory.fields.id as string)
    await expect(category.errorState()).toBeVisible()
  })

  test('when a category has no posts, the reader still sees the hero (no error UI)', async ({ page }) => {
    await mockBlogApi(page, { postsByCategory: 'empty' })
    const category = new BlogCategoryPage(page)
    await category.goto(eventsCategory.fields.id as string)
    await expect(category.hero(eventsCategory.fields.title as string)).toBeVisible()
    await expect(category.cards()).toHaveCount(0)
    await expect(category.errorState()).toHaveCount(0)
  })

  test('the reader can jump back to all articles from a category page', async ({ page }) => {
    await mockBlogApi(page, {})
    const category = new BlogCategoryPage(page)
    const navbar = new BlogNavbar(page)
    const blog = new BlogListingPage(page)

    await category.goto(eventsCategory.fields.id as string)
    await expect(category.hero(eventsCategory.fields.title as string)).toBeVisible()

    await expect(navbar.allArticles()).toBeVisible()
    await navbar.allArticles().click()
    await page.waitForURL('**/blog')
    await expect(blog.postList()).toBeVisible()
  })
})
