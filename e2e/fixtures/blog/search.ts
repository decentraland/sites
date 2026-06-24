import { decentralandTeamAuthor } from './authors'
import { post1Asset, post2Asset, post3Asset } from './assets'
import { announcementsCategory, technologyCategory } from './categories'
import { createBlogPostEntry, createCmsListResponse } from './cms-entry.factory'

// Search response uses the same CMS shape — handlers tag fields with `_highlight`
// markers that cms.search.client.ts enrichHit reads when present.
// We build entries via createBlogPostEntry, then post-process to inject _highlight.

const baseSearchHit1 = createBlogPostEntry({
  id: 'search-hit-1',
  slug: 'metaverse-explainer',
  title: 'A Metaverse Explainer',
  description: 'What the term actually means today.',
  category: announcementsCategory,
  author: decentralandTeamAuthor,
  imageAsset: post1Asset
})

const baseSearchHit2 = createBlogPostEntry({
  id: 'search-hit-2',
  slug: 'open-engine-stack',
  title: 'The Open Engine Stack',
  description: 'Why we open-sourced the runtime.',
  category: technologyCategory,
  author: decentralandTeamAuthor,
  imageAsset: post2Asset
})

const baseSearchHit3 = createBlogPostEntry({
  id: 'search-hit-3',
  slug: 'metaverse-events',
  title: 'Metaverse Events to Watch',
  description: 'The events shaping the year.',
  category: announcementsCategory,
  author: decentralandTeamAuthor,
  imageAsset: post3Asset
})

// CMS search response items have an extra `_highlight` field that cms.search.client.ts reads.
// We inject it as a sibling of `fields`/`sys` to match CMSSearchItem shape.
function withHighlight(entry: ReturnType<typeof createBlogPostEntry>): typeof entry {
  return {
    ...entry,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _highlight: {
      title: `<em>${(entry.fields.title as string).split(' ')[0]}</em> ${(entry.fields.title as string).split(' ').slice(1).join(' ')}`,
      description: entry.fields.description as string
    }
  } as typeof entry & { _highlight: { title: string; description: string } }
}

export const searchHits = [withHighlight(baseSearchHit1), withHighlight(baseSearchHit2), withHighlight(baseSearchHit3)]

export const searchHappyResponse = createCmsListResponse(searchHits, 3)
export const searchEmptyResponse = createCmsListResponse([], 0)

// Paginated SearchPage fixtures: 15 total hits split across 10 + 5. The
// component computes hasMore as `(page+1)*hitsPerPage < total`, so with
// hitsPerPage=10: page 0 → hasMore=true, page 1 → hasMore=false.
const PAGINATED_TOTAL = 15

const paginatedFirstPageHits = Array.from({ length: 10 }, (_, i) =>
  withHighlight(
    createBlogPostEntry({
      id: `paginated-hit-${i + 1}`,
      slug: `paginated-hit-${i + 1}`,
      title: `Paginated Hit ${i + 1}`,
      description: `Description for paginated hit ${i + 1}.`,
      category: announcementsCategory,
      author: decentralandTeamAuthor,
      imageAsset: post1Asset
    })
  )
)

const paginatedSecondPageHits = Array.from({ length: 5 }, (_, i) =>
  withHighlight(
    createBlogPostEntry({
      id: `paginated-hit-${i + 11}`,
      slug: `paginated-hit-${i + 11}`,
      title: `Paginated Hit ${i + 11}`,
      description: `Description for paginated hit ${i + 11}.`,
      category: technologyCategory,
      author: decentralandTeamAuthor,
      imageAsset: post2Asset
    })
  )
)

export const paginatedSearchHits = [...paginatedFirstPageHits, ...paginatedSecondPageHits]
export const searchPaginatedFirstPage = createCmsListResponse(paginatedFirstPageHits, PAGINATED_TOTAL)
export const searchPaginatedSecondPage = createCmsListResponse(paginatedSecondPageHits, PAGINATED_TOTAL)
