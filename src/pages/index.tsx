import { Suspense } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { FooterLanding } from 'decentraland-ui2/dist/components/FooterLanding/FooterLanding'
import { CircularProgress, useDesktopMediaQuery } from 'decentraland-ui2'
import { Hero } from '../components/Home/Hero'
import { Layout } from '../components/Layout'
import { useGetLandingHeroQuery } from '../features/landing/landing.client'
import { Feed } from './index.types'
import { LoadingContainer, SuspenseFallback } from './index.styled'

const IndexPage = () => {
  const isDesktop = useDesktopMediaQuery()

  const [isLoadingUserAgentData] = useAdvancedUserAgentData()

  const { data: heroData, isLoading: isLoadingHero } = useGetLandingHeroQuery()

  const isLoading = isLoadingUserAgentData || isLoadingHero

  return (
    <Layout>
      {isLoading ? (
        <LoadingContainer>
          <CircularProgress color="inherit" />
        </LoadingContainer>
      ) : (
        heroData && <Hero hero={heroData} isDesktop={isDesktop} />
      )}

      <Suspense fallback={<SuspenseFallback />}>
        <FooterLanding />
      </Suspense>
    </Layout>
  )
}

export { Feed, IndexPage }
