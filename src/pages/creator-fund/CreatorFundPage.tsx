import { memo } from 'react'
import { useMediaQuery } from 'decentraland-ui2'
import { heroData } from '../../components/Create/data'
import { HeroBackground, HeroContent, HeroSection, HeroTitle } from '../../components/Create/Hero/Hero.styled'
import { Video } from '../../components/Video'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { CreatorFundOverlay } from './CreatorFundPage.styled'

// Coming-soon placeholder for the Creator Fund. Deliberately carries no program
// details (dates, pool, rules) until they are announced. Reuses the /create hero
// (same video, layout and type scale) so the two creator pages read as one.
const CreatorFundPage = memo(() => {
  const l = useFormatMessage()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const video = isMobile ? heroData.videoPortrait : heroData.videoLandscape
  const poster = isMobile ? heroData.imagePortrait : heroData.imageLandscape

  return (
    <HeroSection>
      <HeroBackground>
        <Video loop muted autoPlay playsInline width={video.width} height={video.height} poster={poster.url} source={video.url} />
      </HeroBackground>
      <CreatorFundOverlay />
      <HeroContent>
        <HeroTitle variant="h1">
          {l('page.creator_fund.title')}
          <br />
          <span>{l('page.creator_fund.coming_soon')}</span>
        </HeroTitle>
      </HeroContent>
    </HeroSection>
  )
})

CreatorFundPage.displayName = 'CreatorFundPage'

export { CreatorFundPage }
