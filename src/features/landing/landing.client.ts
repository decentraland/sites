import { getEnv } from '../../config/env'
import { api } from '../../services/api'
import { clearContentfulCache, resolveLinks } from './landing.helper'
import { mapBannerCta, mapFaq, mapHero, mapMissions, mapSocialProof, mapTextMarquee, mapWhatsHot } from './landing.mappers'
import type {
  ContentfulBannerCTAEntryFieldsProps,
  ContentfulFaqEntriesProps,
  ContentfulHeroEntryFieldsProps,
  ContentfulMissionsListProps,
  ContentfulSocialProofListProps,
  ContentfulTextMarqueeEntry,
  ContentfulWhatsHotListProps
} from './landing.types'

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
    getLandingMissions: build.query<ContentfulMissionsListProps, void>({
      query: () => {
        const missionsId = getEnv('CONTENTFUL_LANDING_MISSIONS_V2_ID')!
        return { url: `/entries/${missionsId}` }
      },
      transformResponse: async (entry: unknown) => {
        try {
          const resolved = await resolveLinks(entry)
          return mapMissions(resolved)
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      providesTags: ['LandingContent']
    }),
    getLandingFaq: build.query<ContentfulFaqEntriesProps, void>({
      query: () => {
        const faqId = getEnv('CONTENTFUL_LANDING_FAQ_ID')!
        return { url: `/entries/${faqId}` }
      },
      transformResponse: async (entry: unknown) => {
        try {
          const resolved = await resolveLinks(entry)
          return mapFaq(resolved)
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      providesTags: ['LandingContent']
    }),
    getLandingCreateAvatarBanner: build.query<ContentfulBannerCTAEntryFieldsProps | null, void>({
      query: () => {
        const createAvatarId = getEnv('CONTENTFUL_LANDING_CREATE_AVATAR_ID')!
        return { url: `/entries/${createAvatarId}` }
      },
      transformResponse: async (entry: unknown) => {
        try {
          const resolved = await resolveLinks(entry)
          return mapBannerCta(resolved)
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      providesTags: ['LandingContent']
    }),
    getLandingStartExploringBanner: build.query<ContentfulBannerCTAEntryFieldsProps | null, void>({
      query: () => {
        const startExploringId = getEnv('CONTENTFUL_LANDING_START_EXPLORING_ID')!
        return { url: `/entries/${startExploringId}` }
      },
      transformResponse: async (entry: unknown) => {
        try {
          const resolved = await resolveLinks(entry)
          return mapBannerCta(resolved)
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      providesTags: ['LandingContent']
    }),
    getLandingWhatsHot: build.query<ContentfulWhatsHotListProps, void>({
      query: () => {
        const whatsHotId = getEnv('CONTENTFUL_LANDING_WHATS_HOT_ID')!
        return { url: `/entries/${whatsHotId}` }
      },
      transformResponse: async (entry: unknown) => {
        try {
          const resolved = await resolveLinks(entry)
          return mapWhatsHot(resolved)
        } catch (error) {
          throw {
            status: 'CUSTOM_ERROR',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      },
      providesTags: ['LandingContent']
    }),
    getLandingTextMarquee: build.query<ContentfulTextMarqueeEntry | null, void>({
      query: () => {
        const marqueeId = getEnv('CONTENTFUL_LANDING_MARQUEE_ID')!
        return { url: `/entries/${marqueeId}` }
      },
      transformResponse: async (entry: unknown) => {
        try {
          const resolved = await resolveLinks(entry)
          return mapTextMarquee(resolved)
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
        const socialProofId = getEnv('CONTENTFUL_LANDING_SOCIAL_PROOF_ID')!
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
    })
  })
})

const {
  useGetLandingCreateAvatarBannerQuery,
  useGetLandingFaqQuery,
  useGetLandingHeroQuery,
  useGetLandingMissionsQuery,
  useGetLandingSocialProofQuery,
  useGetLandingStartExploringBannerQuery,
  useGetLandingTextMarqueeQuery,
  useGetLandingWhatsHotQuery
} = landingClient

export {
  clearContentfulCache,
  useGetLandingCreateAvatarBannerQuery,
  useGetLandingFaqQuery,
  useGetLandingHeroQuery,
  useGetLandingMissionsQuery,
  useGetLandingSocialProofQuery,
  useGetLandingStartExploringBannerQuery,
  useGetLandingTextMarqueeQuery,
  useGetLandingWhatsHotQuery
}
