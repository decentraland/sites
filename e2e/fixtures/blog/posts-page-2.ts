import { adaAuthor, decentralandTeamAuthor, lindaAuthor } from './authors'
import { postsPage2Assets } from './assets'
import { announcementsCategory, eventsCategory, technologyCategory } from './categories'
import { createBlogPostEntry, createCmsListResponse } from './cms-entry.factory'
import { POSTS_TOTAL } from './posts-page-1'

export const postsPage2 = [
  createBlogPostEntry({
    id: 'post-8',
    slug: 'audio-engine-internals',
    title: 'Audio Engine Internals',
    description: 'A guided tour of the spatial audio runtime.',
    category: technologyCategory,
    author: adaAuthor,
    imageAsset: postsPage2Assets[0],
    publishedDate: '2025-12-30T10:00:00.000Z'
  }),
  createBlogPostEntry({
    id: 'post-9',
    slug: 'december-events',
    title: 'December Events Roundup',
    description: 'Everything that happened across the metaverse.',
    category: eventsCategory,
    author: lindaAuthor,
    imageAsset: postsPage2Assets[1],
    publishedDate: '2025-12-28T10:00:00.000Z'
  }),
  createBlogPostEntry({
    id: 'post-10',
    slug: 'sdk-7-1-released',
    title: 'SDK 7.1 Released',
    description: 'Tooling, perf, and ergonomic upgrades shipped.',
    category: announcementsCategory,
    author: decentralandTeamAuthor,
    imageAsset: postsPage2Assets[2],
    publishedDate: '2025-12-22T10:00:00.000Z'
  }),
  createBlogPostEntry({
    id: 'post-11',
    slug: 'live-streaming-pilot',
    title: 'Live Streaming Pilot',
    description: 'How the pilot performed and what we changed.',
    category: technologyCategory,
    author: adaAuthor,
    imageAsset: postsPage2Assets[3],
    publishedDate: '2025-12-15T10:00:00.000Z'
  }),
  createBlogPostEntry({
    id: 'post-12',
    slug: 'community-grants-q4',
    title: 'Community Grants — Q4',
    description: 'Funding outcomes for community-led projects.',
    category: announcementsCategory,
    author: lindaAuthor,
    imageAsset: postsPage2Assets[4],
    publishedDate: '2025-12-10T10:00:00.000Z'
  }),
  createBlogPostEntry({
    id: 'post-13',
    slug: 'best-of-2025',
    title: 'Best of 2025',
    description: 'A year in review across creators, events, and tech.',
    category: eventsCategory,
    author: decentralandTeamAuthor,
    imageAsset: postsPage2Assets[5],
    publishedDate: '2025-12-01T10:00:00.000Z'
  })
]

export const postsPage2Response = createCmsListResponse(postsPage2, POSTS_TOTAL)
