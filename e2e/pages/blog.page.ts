import type { Locator, Page } from '@playwright/test'

// Heavy lazy chunk (DappsShell) takes time on cold load. Initial assertions
// after a fresh `page.goto('/blog/...')` should pass `{ timeout: 15_000 }`.
// Subsequent in-flow assertions can rely on the default expect timeout.
// We never call `waitForLoadState('networkidle')` because deferred analytics
// keep the network busy for ~4s.

// Shared sub-region rendered by BlogLayout on every blog page.
// Holds the per-category links and the Search input. Scoped to the
// `blog-navbar` testid so category links here don't collide with category
// meta links rendered inside cards or post detail headers.
export class BlogNavbar {
  constructor(private readonly page: Page) {}

  private root(): Locator {
    return this.page.getByTestId('blog-navbar')
  }

  // The `All articles` link.
  allArticles(): Locator {
    return this.root().getByRole('link', { name: /all articles/i })
  }

  // Category link in the navbar by display title.
  categoryLink(title: string): Locator {
    return this.root().getByRole('link', { name: title, exact: true })
  }

  // The dropdown search input rendered inside the navbar.
  searchInput(): Locator {
    return this.root().getByPlaceholder(/^search\.\.\.?$/i)
  }

  // The dropdown items that appear after typing 3+ chars. Tagged with
  // `search-hit` to distinguish from the navbar category <li>s.
  searchDropdownHits(): Locator {
    return this.root().getByTestId('search-hit')
  }

  // The "see more results" link that appears when there are >4 hits.
  searchSeeMoreLink(): Locator {
    return this.root().getByRole('link', { name: /see more results/i })
  }

  async typeSearch(value: string) {
    await this.searchInput().fill(value)
  }
}

export class BlogListingPage {
  constructor(private readonly page: Page) {}

  goto(path = '/blog') {
    return this.page.goto(path)
  }

  postList(): Locator {
    return this.page.getByTestId('post-list')
  }

  postListSkeleton(): Locator {
    return this.page.getByTestId('post-list-skeleton')
  }

  errorState(): Locator {
    return this.page.getByTestId('blog-error')
  }

  cards(): Locator {
    return this.postList().getByTestId('post-card')
  }

  mainPostCard(): Locator {
    return this.postList().getByTestId('main-post-card')
  }

  // Card or main-card whose visible text contains the given title.
  cardByTitle(title: string): Locator {
    return this.postList()
      .getByTestId(/^(?:main-)?post-card$/)
      .filter({ hasText: title })
  }

  // Convenience: click the card whose title matches. Uses the inner title-link
  // (each card emits multiple <a>; the title link works for any card variant).
  async clickCardByTitle(title: string) {
    await this.cardByTitle(title).getByRole('link', { name: title }).first().click()
  }
}

export class BlogPostDetailPage {
  constructor(private readonly page: Page) {}

  goto(categorySlug: string, postSlug: string) {
    return this.page.goto(`/blog/${categorySlug}/${postSlug}`)
  }

  // Post title rendered as <TitleText variant="h4"> in PostPage.tsx.
  title(): Locator {
    return this.page.getByTestId('post-title')
  }

  // Rich-text body container. Scoped paragraphs only — must NOT match
  // chrome <p>s like ShareLabel or AuthorName.
  body(): Locator {
    return this.page.getByTestId('post-body')
  }

  // CategoryMetaLink in the post header (NOT the related-post cards).
  categoryLink(): Locator {
    return this.page.getByTestId('post-category-meta')
  }

  // AuthorLink in the post header (NOT related-post author links).
  authorLink(): Locator {
    return this.page.getByTestId('post-author')
  }

  // Share intent CTAs.
  shareTwitter(): Locator {
    return this.page.getByTestId('post-share-twitter')
  }

  shareFacebook(): Locator {
    return this.page.getByTestId('post-share-facebook')
  }

  // RelatedPost section rendered below the body (sibling, not nested).
  relatedPosts(): Locator {
    return this.page.getByTestId('related-posts')
  }

  // Cards inside RelatedPost — distinct from the listing/grid cards because
  // those live on /blog, not /blog/:cat/:slug.
  relatedCards(): Locator {
    return this.relatedPosts().getByTestId('post-card')
  }

  errorState(): Locator {
    return this.page.getByTestId('blog-error')
  }
}

export class BlogCategoryPage {
  constructor(private readonly page: Page) {}

  goto(categorySlug: string) {
    return this.page.goto(`/blog/${categorySlug}`)
  }

  // CategoryHero (HeroContainer testid) scopes the assertion to the page hero
  // — avoids matching card titles that happen to share the category name.
  hero(name: string): Locator {
    return this.page.getByTestId('category-hero').getByRole('heading', { name })
  }

  errorState(): Locator {
    return this.page.getByTestId('blog-error')
  }

  postList(): Locator {
    return this.page.getByTestId('post-list')
  }

  cards(): Locator {
    return this.postList().getByTestId('post-card')
  }

  async clickCardByTitle(title: string) {
    await this.postList().getByRole('link', { name: title }).first().click()
  }
}

export class BlogAuthorPage {
  constructor(private readonly page: Page) {}

  goto(authorSlug: string) {
    return this.page.goto(`/blog/author/${authorSlug}`)
  }

  // Author header testid scopes to the page header (avoids matching same name
  // inside card chrome if author titles ever land there).
  authorHeading(name: string): Locator {
    return this.page.getByTestId('author-header').getByRole('heading', { name })
  }

  errorState(): Locator {
    return this.page.getByTestId('blog-error')
  }

  postList(): Locator {
    return this.page.getByTestId('post-list')
  }

  cards(): Locator {
    return this.postList().getByTestId('post-card')
  }

  async clickCardByTitle(title: string) {
    await this.postList().getByRole('link', { name: title }).first().click()
  }
}

export class BlogSearchPage {
  constructor(private readonly page: Page) {}

  goto(query: string) {
    return this.page.goto(`/blog/search?q=${encodeURIComponent(query)}`)
  }

  results(): Locator {
    return this.page.locator('main').getByRole('link')
  }

  emptyState(): Locator {
    return this.page.getByText(/nothing to show/i)
  }
}
