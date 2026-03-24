import { getEnv } from '../../config/env'
import { api } from '../../services/api'
import { clearContentfulCache, resolveLinks } from './landing.helper'
import { mapHero } from './landing.mappers'
import type { ContentfulHeroEntryFieldsProps } from './landing.types'

// RTK Query endpoints
const landingClient = api.injectEndpoints({
  endpoints: build => ({
    // Priority query - just the hero for immediate display
    getLandingHero: build.query<ContentfulHeroEntryFieldsProps, void>({
      query: () => {
        const heroMainId = getEnv('CONTENTFUL_HOMEPAGE_HERO_ID')!
        return { url: `/entries/${heroMainId}` }
      },
      transformResponse: async (entry: unknown) => {
        try {
          const heroEntry = await resolveLinks(entry)
          const hero = mapHero(heroEntry)
          if (!hero) {
            throw new Error('Failed to map hero content')
          }
          return hero
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      providesTags: ['LandingContent']
    })
  })
})

const { useGetLandingHeroQuery } = landingClient

export { clearContentfulCache, useGetLandingHeroQuery }
