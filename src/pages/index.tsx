import { Suspense, lazy, useMemo } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { FooterLanding } from 'decentraland-ui2/dist/components/FooterLanding/FooterLanding'
import { Typography, useDesktopMediaQuery } from 'decentraland-ui2'
import { Hero } from '../components/Landing/Hero'
import { Layout } from '../components/Layout'
import { getEnv } from '../config/env'
import { useAuth } from '../context/Auth/useAuth'
import {
  useGetLandingCreateAvatarBannerQuery,
  useGetLandingFaqQuery,
  useGetLandingHeroQuery,
  useGetLandingMissionsQuery,
  useGetLandingSocialProofQuery,
  useGetLandingStartExploringBannerQuery,
  useGetLandingTextMarqueeQuery,
  useGetLandingWhatsHotQuery
} from '../features/landing/landing.client'
import { useFormatMessage } from '../hooks/adapters/useFormatMessage'
import { SegmentEvent } from '../modules/segment'
import { Feed } from './index.types'
import { LoadingContainer, SuspenseFallback } from './index.styled'

// Lazy load components that are below the fold
const Missions = lazy(() =>
  import('../components/Landing/Missions').then((m) => ({
    default: m.Missions
  }))
)
const BannerCTA = lazy(() =>
  import('../components/Landing/BannerCTA').then((m) => ({
    default: m.BannerCTA
  }))
)
const TrendingNews = lazy(() =>
  import('../components/Landing/TrendingNews').then((m) => ({
    default: m.TrendingNews
  }))
)
const SocialProof = lazy(() =>
  import('../components/Landing/SocialProof').then((m) => ({
    default: m.SocialProof
  }))
)
const TextMarquee = lazy(() =>
  import('../components/Landing/TextMarquee').then((m) => ({
    default: m.TextMarquee
  }))
)

const IndexPage = () => {
  const l = useFormatMessage()

  const isDesktop = useDesktopMediaQuery()

  const [isLoadingUserAgentData] = useAdvancedUserAgentData()

  // Load hero first for immediate display
  const { data: heroData } = useGetLandingHeroQuery()

  // Load rest of content in background (independent fetches)
  const { data: missions, isLoading: isLoadingMissions } = useGetLandingMissionsQuery()
  const { data: createAvatarBanner, isLoading: isLoadingCreateAvatar } = useGetLandingCreateAvatarBannerQuery()
  const { data: startExploringBanner, isLoading: isLoadingStartExploring } = useGetLandingStartExploringBannerQuery()
  const { data: whatsHot, isLoading: isLoadingWhatsHot } = useGetLandingWhatsHotQuery()
  const { data: socialProof, isLoading: isLoadingSocialProof } = useGetLandingSocialProofQuery()
  const { data: faq, isLoading: isLoadingFaq } = useGetLandingFaqQuery()
  const { data: textMarquee } = useGetLandingTextMarqueeQuery()

  const { isConnected, isConnecting } = useAuth()

  const hideNavbar = useMemo(() => {
    if (typeof window === 'undefined') return false
    const searchParams = new URLSearchParams(window.location.search)
    return searchParams.has('newUser') || searchParams.has('newuser') || searchParams.has('new_user') || searchParams.has('new-user')
  }, [])

  // Show hero immediately, even while loading other content
  const showHero = !isLoadingUserAgentData && !!heroData
  const hero = heroData

  return (
    <Layout>
      {/* Hero - loads first */}
      {showHero && hero && (
        <Hero hero={hero} isDesktop={isDesktop} hideNavbar={hideNavbar} isLoggedIn={isConnected} isLoading={isConnecting} />
      )}

      {/* Loading state while fetching content */}
      {(isLoadingMissions ||
        isLoadingCreateAvatar ||
        isLoadingWhatsHot ||
        isLoadingSocialProof ||
        isLoadingStartExploring ||
        isLoadingFaq) &&
        !missions &&
        !createAvatarBanner &&
        !whatsHot &&
        !socialProof &&
        !startExploringBanner &&
        !faq &&
        !heroData && (
          <LoadingContainer>
            <Typography variant="body1">Loading...</Typography>
          </LoadingContainer>
        )}

      {/* Rest of content - lazy loaded */}
      <Suspense fallback={<SuspenseFallback />}>
        {missions && <Missions missions={missions} isDesktop={isDesktop} isLoggedIn={isConnected} />}

        {createAvatarBanner && (
          <Suspense fallback={<SuspenseFallback />}>
            <BannerCTA
              {...createAvatarBanner}
              eventPlace={SegmentEvent.CreateYourAvatar}
              isDesktop={isDesktop}
              isLoggedIn={isConnected}
              buttonLabel={l('index.get_started')}
              url={getEnv('ONBOARDING_URL')!}
            />
          </Suspense>
        )}

        {whatsHot && (
          <Suspense fallback={<SuspenseFallback />}>
            <TrendingNews list={whatsHot.list} />
          </Suspense>
        )}

        {textMarquee && (
          <Suspense fallback={<SuspenseFallback />}>
            <TextMarquee text={textMarquee.text} />
          </Suspense>
        )}

        {socialProof && (
          <Suspense fallback={<SuspenseFallback />}>
            <SocialProof socialProof={socialProof} />
          </Suspense>
        )}

        {startExploringBanner && (
          <Suspense fallback={<SuspenseFallback />}>
            <BannerCTA
              {...startExploringBanner}
              eventPlace={SegmentEvent.GoToExplorer}
              isDesktop={isDesktop}
              isLoggedIn={isConnected}
              buttonLabel={l('index.create_my_account')}
              url={getEnv('ONBOARDING_URL')!}
            />
          </Suspense>
        )}

        <Suspense fallback={<SuspenseFallback />}>
          <FooterLanding />
        </Suspense>
      </Suspense>
    </Layout>
  )
}

export { Feed, IndexPage }
