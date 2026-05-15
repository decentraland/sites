import type { Locator, Page } from '@playwright/test'

// Heavy lazy chunk (DappsShell) takes time on cold load. Initial assertions
// rely on Playwright's default expect timeout (~5s) plus the explicit waits
// callers use; we don't add waitForLoadState('networkidle') because deferred
// analytics keep the network busy for ~4s.

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

  // PostCard containers inside the real (non-skeleton) post grid
  cards(): Locator {
    return this.postList().getByTestId('post-card')
  }

  mainPostCard(): Locator {
    return this.postList().getByTestId('main-post-card')
  }

  // Card or main-card whose title contains the given text
  cardByTitle(title: string): Locator {
    return this.postList()
      .getByTestId(/^(?:main-)?post-card$/)
      .filter({ hasText: title })
  }
}

export class BlogPostDetailPage {
  constructor(private readonly page: Page) {}

  goto(categorySlug: string, postSlug: string) {
    return this.page.goto(`/blog/${categorySlug}/${postSlug}`)
  }

  title(): Locator {
    return this.page.getByRole('heading', { level: 4 })
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

  hero(name: string): Locator {
    return this.page.getByRole('heading', { name })
  }

  errorState(): Locator {
    return this.page.getByTestId('blog-error')
  }

  postList(): Locator {
    return this.page.getByTestId('post-list')
  }
}

export class BlogAuthorPage {
  constructor(private readonly page: Page) {}

  goto(authorSlug: string) {
    return this.page.goto(`/blog/author/${authorSlug}`)
  }

  authorHeading(name: string): Locator {
    return this.page.getByRole('heading', { name })
  }

  errorState(): Locator {
    return this.page.getByTestId('blog-error')
  }

  postList(): Locator {
    return this.page.getByTestId('post-list')
  }
}

export class BlogSearchPage {
  constructor(private readonly page: Page) {}

  goto(query: string) {
    return this.page.goto(`/blog/search?q=${encodeURIComponent(query)}`)
  }

  results(): Locator {
    // SearchResultCard renders an <a> per result inside the page; getByRole
    // selects them by accessible link role and excludes the navbar.
    return this.page.locator('main').getByRole('link')
  }

  emptyState(): Locator {
    return this.page.getByText(/nothing to show/i)
  }
}
