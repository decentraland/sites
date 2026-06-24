// Scenario knobs the dispatcher (mocks/blog.ts) reads to pick a fixture per
// endpoint. Each field is keyed by the user-facing outcome you want, NOT by
// the wire format: pass `posts: 'empty'` to render an empty blog landing,
// regardless of what the underlying CMS would normally do.
export type BlogScenario = {
  // /blog landing list: happy = 7 posts, empty = no posts, error = 500,
  // multi-page = 7 posts + a second page available on scroll.
  posts?: 'happy' | 'empty' | 'error' | 'multi-page'
  // Override for the second infinite-scroll page (when scenario.posts is
  // multi-page or happy). Useful to simulate "page 2 fails".
  postsPage2?: 'happy' | 'error'
  // Artificial latency on /blog/posts responses, to expose loading states.
  postsDelayMs?: number
  // Post detail by slug. happy = renders the matching fixture; not-found =
  // empty list (UI shows generic error); error = 500.
  postBySlug?: 'happy' | 'not-found' | 'error'
  // Category landing list (filtered by ?category=…). Used by /blog/:cat and
  // by the related-posts section in /blog/:cat/:slug.
  postsByCategory?: 'happy' | 'empty' | 'error'
  // Author landing list (filtered by ?author=…).
  postsByAuthor?: 'happy' | 'empty' | 'error'
  // /blog/categories — feeds the navbar dropdown and the category page hero.
  categories?: 'happy' | 'empty' | 'error'
  // /blog/authors — feeds /blog/author/:slug.
  authors?: 'happy' | 'empty' | 'error'
  // Navbar quick-search dropdown (`hitsPerPage=5`). `happy` = 3 hits;
  // `overflow` = 10 hits so the "see more results" link renders (>4 trigger).
  search?: 'happy' | 'overflow' | 'empty' | 'error'
  // /blog/search page (`hitsPerPage=10`). `paginated` = 15 hits split across
  // 2 pages (Load more button visible on page 1). Defaults to `scenario.search`.
  searchPage?: 'happy' | 'paginated' | 'empty' | 'error'
  // Direct asset fetch (rarely needed — fixtures embed assets inline).
  asset?: 'happy' | 'not-found'
  // Direct entry fetch by sys.id (rarely needed — fixtures embed refs inline).
  entry?: 'happy' | 'not-found'
}
