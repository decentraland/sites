import { memo, useCallback } from 'react'
import { useMediaQuery } from 'decentraland-ui2'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useTypingListEffect } from '../../../hooks/useTypingListEffect'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { CTAButton } from '../../Buttons/CTAButton'
import { Video } from '../../Video'
import { heroData } from '../data'
import { Chevron } from './Chevron'
import { ChevronContainer, HeroActions, HeroBackground, HeroContent, HeroSection, HeroSubtitle, HeroTitle } from './Hero.styled'

const CREATOR_HUB_DOWNLOAD_URL = 'https://decentraland.org/download/creator-hub'

const CreatorsHero = memo(() => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const currentWord = useTypingListEffect(heroData.changingWords)
  const trackClick = useTrackClick()

  const handleDownloadClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      trackClick(event)
    },
    [trackClick]
  )

  return (
    <>
      <HeroSection>
        <HeroBackground>
          {!isMobile && (
            <Video
              loop
              muted
              autoPlay
              playsInline
              width={heroData.videoLandscape.width}
              height={heroData.videoLandscape.height}
              poster={heroData.imageLandscape.url}
              source={heroData.videoLandscape.url}
            />
          )}
          {isMobile && (
            <Video
              loop
              muted
              autoPlay
              playsInline
              width={heroData.videoPortrait.width}
              height={heroData.videoPortrait.height}
              poster={heroData.imagePortrait.url}
              source={heroData.videoPortrait.url}
            />
          )}
        </HeroBackground>
        <HeroContent>
          <HeroTitle>
            {heroData.titleFirstLine}
            <br />
            <span>{currentWord}</span>
            <br />
            {heroData.titleLastLine}
          </HeroTitle>
          <HeroSubtitle>{heroData.subtitle}</HeroSubtitle>
          <HeroActions>
            <CTAButton
              href={CREATOR_HUB_DOWNLOAD_URL}
              onClick={handleDownloadClick}
              event={SegmentEvent.DOWNLOAD}
              place={SectionViewedTrack.CREATORS_HERO}
              label="Download Creator Hub"
              isFullWidth={false}
            />
          </HeroActions>
        </HeroContent>
      </HeroSection>
      <ChevronContainer>
        <Chevron dark />
      </ChevronContainer>
    </>
  )
})

export { CreatorsHero }
