import { adaAuthor, decentralandTeamAuthor, lindaAuthor } from './authors'
import { post1Asset, post2Asset, post3Asset, post4Asset, post5Asset, post6Asset, post7Asset } from './assets'
import { announcementsCategory, eventsCategory, technologyCategory } from './categories'
import { createBlogPostEntry, createCmsListResponse } from './cms-entry.factory'

export const featuredPost = createBlogPostEntry({
  id: 'post-1',
  slug: 'welcome-to-decentraland',
  title: 'Welcome to Decentraland',
  description: 'Everything you need to know to start exploring the metaverse.',
  category: announcementsCategory,
  author: decentralandTeamAuthor,
  imageAsset: post1Asset,
  publishedDate: '2026-01-20T10:00:00.000Z'
})

export const gridPosts = [
  createBlogPostEntry({
    id: 'post-2',
    slug: 'creator-jam-2026',
    title: 'Creator Jam 2026',
    description: 'Recap of the global creator gathering.',
    category: eventsCategory,
    author: adaAuthor,
    imageAsset: post2Asset,
    publishedDate: '2026-01-18T10:00:00.000Z'
  }),
  createBlogPostEntry({
    id: 'post-3',
    slug: 'shader-pipeline-update',
    title: 'Shader Pipeline Update',
    description: 'How the new pipeline cuts cold-start times.',
    category: technologyCategory,
    author: adaAuthor,
    imageAsset: post3Asset,
    publishedDate: '2026-01-15T10:00:00.000Z'
  }),
  createBlogPostEntry({
    id: 'post-4',
    slug: 'community-spotlight-january',
    title: 'Community Spotlight: January',
    description: 'Highlighting member-built experiences this month.',
    category: announcementsCategory,
    author: lindaAuthor,
    imageAsset: post4Asset,
    publishedDate: '2026-01-10T10:00:00.000Z'
  }),
  createBlogPostEntry({
    id: 'post-5',
    slug: 'open-source-the-launcher',
    title: 'We Open-Sourced the Launcher',
    description: 'Contribute, fork, or self-host the desktop client.',
    category: technologyCategory,
    author: decentralandTeamAuthor,
    imageAsset: post5Asset,
    publishedDate: '2026-01-08T10:00:00.000Z'
  }),
  createBlogPostEntry({
    id: 'post-6',
    slug: 'gdc-recap',
    title: 'GDC 2026 Recap',
    description: 'Talks, demos, and announcements from the show floor.',
    category: eventsCategory,
    author: lindaAuthor,
    imageAsset: post6Asset,
    publishedDate: '2026-01-05T10:00:00.000Z'
  }),
  createBlogPostEntry({
    id: 'post-7',
    slug: 'wearables-roadmap',
    title: 'Wearables Roadmap',
    description: 'The next six months of wearable creator tools.',
    category: announcementsCategory,
    author: decentralandTeamAuthor,
    imageAsset: post7Asset,
    publishedDate: '2026-01-02T10:00:00.000Z'
  })
]

export const allPostsPage1 = [featuredPost, ...gridPosts]

// Total includes posts that exist on page 2 to make hasMore true
export const POSTS_TOTAL = 13

export const postsPage1Response = createCmsListResponse(allPostsPage1, POSTS_TOTAL)
