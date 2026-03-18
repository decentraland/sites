import { Suspense } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { FooterLanding } from 'decentraland-ui2/dist/components/FooterLanding/FooterLanding'
import { useDesktopMediaQuery } from 'decentraland-ui2'
import { HeroSection } from '../components/Home/HeroSection'
import { Layout } from '../components/Layout'
import { useGetLandingHeroQuery } from '../features/landing/landing.client'
import { Feed } from './index.types'
import { SuspenseFallback } from './index.styled'

const IndexPage = () => {
  const isDesktop = useDesktopMediaQuery()

  const [isLoadingUserAgentData] = useAdvancedUserAgentData()

  // Load hero first for immediate display
  const { data: heroData } = useGetLandingHeroQuery()

  // Show hero immediately, even while loading other content
  const showHero = !isLoadingUserAgentData && !!heroData

  return (
    <Layout>
      {/* Hero - loads first */}
      {showHero && heroData && <HeroSection hero={heroData} isDesktop={isDesktop} />}

      {/* Rest of content - lazy loaded */}
      <Suspense fallback={<SuspenseFallback />}>
        <Suspense fallback={<SuspenseFallback />}>
          <FooterLanding />
        </Suspense>
      </Suspense>
    </Layout>
  )
}

export { Feed, IndexPage }
