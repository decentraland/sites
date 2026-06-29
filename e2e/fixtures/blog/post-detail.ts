import { decentralandTeamAuthor } from './authors'
import { heroAsset } from './assets'
import { announcementsCategory } from './categories'
import { createBlogPostEntry, createCmsListResponse, createDocument } from './cms-entry.factory'

// Full post used by /blog/:cat/:slug detail tests. Body is a small but real
// Contentful rich-text Document so RichText renderer has paragraphs to render.
export const detailPost = createBlogPostEntry({
  id: 'post-detail',
  slug: 'detail-post',
  title: 'A Long-Form Detail Post',
  description: 'Used by the post-detail spec to verify full rendering.',
  category: announcementsCategory,
  author: decentralandTeamAuthor,
  imageAsset: heroAsset,
  publishedDate: '2026-01-22T10:00:00.000Z',
  body: createDocument([
    'This is the opening paragraph of the detail post. It exists to verify that the rich-text renderer produces visible text in the DOM.',
    'Second paragraph confirms multiple blocks render in sequence.'
  ])
})

// /blog/posts?slug=detail-post → returns a list with one matching item
export const detailListResponse = createCmsListResponse([detailPost], 1)

// Empty list — used by `postBySlug: 'not-found'`
export const detailNotFoundResponse = createCmsListResponse([], 0)
