import { api } from '../../services/api'
import { ContentfulEntryKey, clearContentfulCache, contentfulEndpoint } from '../contentful/contentful.helper'
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
    getLandingHero: build.query<ContentfulHeroEntryFieldsProps, void>(
      contentfulEndpoint(ContentfulEntryKey.LANDING_HERO, mapHero, hero => {
        if (!hero) throw new Error('Failed to map hero content')
        return hero
      })
    ),
    getLandingMissions: build.query<ContentfulMissionsListProps, void>(
      contentfulEndpoint(ContentfulEntryKey.LANDING_MISSIONS, mapMissions)
    ),
    getLandingFaq: build.query<ContentfulFaqEntriesProps, void>(contentfulEndpoint(ContentfulEntryKey.LANDING_FAQ, mapFaq)),
    getLandingCreateAvatarBanner: build.query<ContentfulBannerCTAEntryFieldsProps | null, void>(
      contentfulEndpoint(ContentfulEntryKey.LANDING_CREATE_AVATAR_BANNER, mapBannerCta)
    ),
    getLandingStartExploringBanner: build.query<ContentfulBannerCTAEntryFieldsProps | null, void>(
      contentfulEndpoint(ContentfulEntryKey.LANDING_START_EXPLORING_BANNER, mapBannerCta)
    ),
    getLandingWhatsHot: build.query<ContentfulWhatsHotListProps, void>(
      contentfulEndpoint(ContentfulEntryKey.LANDING_WHATS_HOT, mapWhatsHot)
    ),
    getLandingTextMarquee: build.query<ContentfulTextMarqueeEntry | null, void>(
      contentfulEndpoint(ContentfulEntryKey.LANDING_TEXT_MARQUEE, mapTextMarquee)
    ),
    getLandingSocialProof: build.query<ContentfulSocialProofListProps, void>(
      contentfulEndpoint(ContentfulEntryKey.LANDING_SOCIAL_PROOF, mapSocialProof)
    )
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
