import { memo } from 'react'
import { useMediaQuery } from 'decentraland-ui2'
import { CTAButton } from '../../components/Buttons'
import { heroData } from '../../components/Create/data'
import { HeroActions, HeroBackground, HeroContent, HeroSection, HeroSubtitle, HeroTitle } from '../../components/Create/Hero/Hero.styled'
import { Video } from '../../components/Video'
import { useFormatMessage } from '../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../hooks/adapters/useTrackLinkContext'
import { SectionViewedTrack, SegmentEvent } from '../../modules/segment'
import { CreatorFundBadge, CreatorFundBadgeDot, CreatorFundOverlay, CreatorFundPool } from './CreatorFundPage.styled'

// The Creator Hub is desktop-only; /create already sends each device to the right
// place (installer on desktop, creator docs on phones), so the CTA points there.
const CREATE_URL = '/create'

// Coming-soon banner for the Creator Fund Beta Season. Reuses the /create hero
// (same video, layout and type scale) so the two creator pages read as one.
const CreatorFundPage = memo(() => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
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
        <CreatorFundBadge>
          <CreatorFundBadgeDot />
          {l('page.creator_fund.badge')}
        </CreatorFundBadge>
        <HeroTitle variant="h1">
          {l('page.creator_fund.title')}
          <br />
          <span>{l('page.creator_fund.title_highlight')}</span>
        </HeroTitle>
        <HeroSubtitle>
          {l('page.creator_fund.description')}
          <CreatorFundPool>{l('page.creator_fund.pool')}</CreatorFundPool>
        </HeroSubtitle>
        <HeroActions>
          <CTAButton
            href={CREATE_URL}
            onClick={trackClick}
            event={SegmentEvent.CLICK}
            place={SectionViewedTrack.CREATOR_FUND_HERO}
            label={l('page.creator_fund.cta')}
            isFullWidth={false}
          />
        </HeroActions>
      </HeroContent>
    </HeroSection>
  )
})

CreatorFundPage.displayName = 'CreatorFundPage'

export { CreatorFundPage }
