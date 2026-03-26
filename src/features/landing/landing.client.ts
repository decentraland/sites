import { getEnv } from '../../config/env'
import { api } from '../../services/api'
import { clearContentfulCache, resolveLinks } from './landing.helper'
import { mapHero, mapSocialProof, mapWeeklyRituals } from './landing.mappers'
import type { ContentfulHeroEntryFieldsProps, ContentfulSocialProofListProps, ContentfulWeeklyRitualsProps } from './landing.types'

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
    }),
    getLandingSocialProof: build.query<ContentfulSocialProofListProps, void>({
      query: () => {
        const socialProofId = getEnv('CONTENTFUL_HOMEPAGE_CATCH_THE_VIBE_ID')
        if (!socialProofId) {
          throw new Error('CONTENTFUL_HOMEPAGE_CATCH_THE_VIBE_ID is not configured')
        }
        return { url: `/entries/${socialProofId}` }
      },
      transformResponse: async (entry: unknown) => {
        try {
          const resolved = await resolveLinks(entry)
          return mapSocialProof(resolved)
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      providesTags: ['LandingContent']
    }),
    getWeeklyRituals: build.query<ContentfulWeeklyRitualsProps, void>({
      query: () => {
        return { url: '/entries/1DnAUdrnIf0YJr8KcPSRyV' }
      },
      transformResponse: async (entry: unknown) => {
        try {
          const resolved = await resolveLinks(entry)
          return mapWeeklyRituals(resolved)
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

const { useGetLandingHeroQuery, useGetLandingSocialProofQuery, useGetWeeklyRitualsQuery } = landingClient

export { clearContentfulCache, useGetLandingHeroQuery, useGetLandingSocialProofQuery, useGetWeeklyRitualsQuery }
