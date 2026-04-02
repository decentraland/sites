import { memo } from 'react'
import { useDesktopMediaQuery, useMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useCreatorHubDownload } from '../../../hooks/useCreatorHubDownload'
import { useTypingListEffect } from '../../../hooks/useTypingListEffect'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import { CTAButton } from '../../Buttons/CTAButton'
import { Video } from '../../Video'
import { heroData } from '../data'
import {
  AlsoAvailableContainer,
  AlsoAvailableText,
  AlternativeButtonImage,
  AlternativeIconButton,
  DownloadButtonImage
} from '../DownloadButtons.styled'
import { Chevron } from './Chevron'
import { ChevronContainer, HeroActions, HeroBackground, HeroContent, HeroSection, HeroSubtitle, HeroTitle } from './Hero.styled'

const CREATOR_HUB_DOWNLOAD_URL = '/download/creator-hub'

const CreatorsHero = memo(() => {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isDesktop = useDesktopMediaQuery()
  const currentWord = useTypingListEffect(heroData.changingWords)
  const trackClick = useTrackClick()
  const l = useFormatMessage()
  const { isReady, primaryOption, secondaryOptions, handleDownload } = useCreatorHubDownload()

  const showDownloadOptions = isDesktop && isReady

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
            {showDownloadOptions && primaryOption?.link ? (
              <>
                <CTAButton
                  href={primaryOption.link}
                  onClick={event => {
                    event.preventDefault()
                    trackClick(event)
                    handleDownload(primaryOption)
                  }}
                  event={SegmentEvent.DOWNLOAD}
                  place={SectionViewedTrack.CREATORS_HERO}
                  endIcon={<DownloadButtonImage src={primaryOption.image} alt="" />}
                  label={l('page.download.download_creator_hub')}
                  isFullWidth={false}
                />
                {secondaryOptions.length > 0 && (
                  <AlsoAvailableContainer>
                    <AlsoAvailableText>{l('page.creator-hub.download.also_available')}</AlsoAvailableText>
                    {secondaryOptions.map(option => (
                      <AlternativeIconButton
                        key={option.text}
                        onClick={event => {
                          event.preventDefault()
                          trackClick(event)
                          handleDownload(option)
                        }}
                      >
                        <AlternativeButtonImage src={option.image} alt={option.text} />
                      </AlternativeIconButton>
                    ))}
                  </AlsoAvailableContainer>
                )}
              </>
            ) : (
              <CTAButton
                href={CREATOR_HUB_DOWNLOAD_URL}
                onClick={event => {
                  trackClick(event)
                }}
                event={SegmentEvent.DOWNLOAD}
                place={SectionViewedTrack.CREATORS_HERO}
                label={l('page.download.download_creator_hub')}
                isFullWidth={false}
              />
            )}
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
