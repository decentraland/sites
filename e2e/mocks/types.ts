export type BlogScenario = {
  // /blog/posts (skip=0, no slug, no q)
  posts?: 'happy' | 'empty' | 'error' | 'multi-page'
  // /blog/posts (skip=20) — only used for infinite-scroll tests
  postsPage2?: 'happy' | 'error'
  // Latency in ms applied to /blog/posts responses
  postsDelayMs?: number
  // /blog/posts?slug=...
  postBySlug?: 'happy' | 'not-found' | 'error'
  // /blog/posts?category=...
  postsByCategory?: 'happy' | 'empty' | 'error'
  // /blog/posts?author=...
  postsByAuthor?: 'happy' | 'empty' | 'error'
  // /blog/categories
  categories?: 'happy' | 'empty' | 'error'
  // /blog/authors
  authors?: 'happy' | 'empty' | 'error'
  // /blog/posts?q=...
  search?: 'happy' | 'empty' | 'error'
  // /assets/:id
  asset?: 'happy' | 'not-found'
  // /entries/:id (used by reference resolution + getBlogPost)
  entry?: 'happy' | 'not-found'
}
