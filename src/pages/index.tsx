import { Suspense } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { FooterLanding } from 'decentraland-ui2/dist/components/FooterLanding/FooterLanding'
import { CircularProgress, useDesktopMediaQuery } from 'decentraland-ui2'
import { CatchTheVibe } from '../components/Home/CatchTheVibe'
import { ComeHangOut } from '../components/Home/ComeHangOut'
import { Hero } from '../components/Home/Hero'
import { WeeklyRituals } from '../components/Home/WeeklyRituals'
import { WhatsOn } from '../components/Home/WhatsOn'
import { useGetLandingHeroQuery } from '../features/landing/landing.client'
import { Feed } from './index.types'
import { LoadingContainer, SuspenseFallback } from './index.styled'

const IndexPage = () => {
  const isDesktop = useDesktopMediaQuery()

  const [isLoadingUserAgentData] = useAdvancedUserAgentData()

  const { data: heroData, isLoading: isLoadingHero } = useGetLandingHeroQuery()

  const isLoading = isLoadingUserAgentData || isLoadingHero

  return (
    <>
      {isLoading ? (
        <LoadingContainer>
          <CircularProgress color="inherit" />
        </LoadingContainer>
      ) : (
        heroData && <Hero hero={heroData} isDesktop={isDesktop} />
      )}

      <WhatsOn />

      <CatchTheVibe />

      <WeeklyRituals />

      <ComeHangOut />

      <Suspense fallback={<SuspenseFallback />}>
        <FooterLanding />
      </Suspense>
    </>
  )
}

export { Feed, IndexPage }
