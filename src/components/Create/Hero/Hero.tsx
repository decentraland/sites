import { memo } from 'react'
import { useDesktopMediaQuery, useMediaQuery } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useCreatorHubDownload } from '../../../hooks/useCreatorHubDownload'
import { useDownloadClick } from '../../../hooks/useDownloadClick'
import { useTypingListEffect } from '../../../hooks/useTypingListEffect'
import { DownloadPlace, DownloadTarget, SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
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
  // Download CTA adapter (not the plain click adapter): the primary flow
  // navigates to the success page ~3s after the click, so a cold-load click
  // must beacon instead of queueing in the component-scoped deferred queue,
  // which navigation would tear down. Also folds in campaign (utm_*) params.
  // recordCorrelation:false — the Creator Hub success page joins on
  // anon_user_id, not click_id, so minting a correlation id here would only
  // orphan it and clobber the Explorer funnel's shared key.
  const trackDownloadClick = useDownloadClick({ recordCorrelation: false })
  // Plain click adapter for the (non-download) scroll chevron.
  const trackClick = useTrackClick()
  const l = useFormatMessage()
  // Report the /create hero as its own download place so these downloads are
  // no longer mixed with the /download/creator-hub page in the warehouse.
  const { isReady, primaryOption, secondaryOptions, handleDownload } = useCreatorHubDownload(DownloadPlace.CREATORS_HERO)

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
                    trackDownloadClick(event)
                    handleDownload(primaryOption)
                  }}
                  event={SegmentEvent.DOWNLOAD}
                  place={SectionViewedTrack.CREATORS_HERO}
                  downloadTarget={DownloadTarget.CREATOR_HUB}
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
                        data-place={SectionViewedTrack.CREATORS_HERO}
                        data-event={SegmentEvent.DOWNLOAD}
                        data-os={option.text}
                        data-download-target={DownloadTarget.CREATOR_HUB}
                        onClick={event => {
                          event.preventDefault()
                          trackDownloadClick(event)
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
                  trackDownloadClick(event)
                }}
                event={SegmentEvent.DOWNLOAD}
                place={SectionViewedTrack.CREATORS_HERO}
                downloadTarget={DownloadTarget.CREATOR_HUB}
                label={l('page.download.download_creator_hub')}
                isFullWidth={false}
              />
            )}
          </HeroActions>
        </HeroContent>
      </HeroSection>
      <ChevronContainer
        type="button"
        aria-label={l('component.creators_landing.hero.scroll_label')}
        onClick={event => {
          trackClick(event)
          window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })
        }}
        data-place={SectionViewedTrack.CREATORS_HERO}
        data-event={SegmentEvent.CLICK}
        data-title="scroll-to-why"
      >
        <Chevron dark />
      </ChevronContainer>
    </>
  )
})

export { CreatorsHero }
