import { categoryAsset } from './assets'
import { createCategoryEntry, createCmsListResponse } from './cms-entry.factory'

export const announcementsCategory = createCategoryEntry({
  id: 'cat-announcements',
  slug: 'announcements',
  title: 'Announcements',
  description: 'Decentraland announcements and updates',
  imageAsset: categoryAsset
})

export const eventsCategory = createCategoryEntry({
  id: 'cat-events',
  slug: 'events',
  title: 'Events',
  description: 'Upcoming and past events',
  imageAsset: categoryAsset
})

export const technologyCategory = createCategoryEntry({
  id: 'cat-technology',
  slug: 'technology',
  title: 'Technology',
  description: 'Engineering deep dives',
  imageAsset: categoryAsset
})

export const allCategories = [announcementsCategory, eventsCategory, technologyCategory]

export const categoriesListResponse = createCmsListResponse(allCategories)
