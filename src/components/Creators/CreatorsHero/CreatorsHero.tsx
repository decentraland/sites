import { memo, useEffect, useRef, useState } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { isWebpSupported, useImageOptimization, useVideoOptimization } from '../../../hooks/contentful'
import { Repo, useLatestGithubRelease } from '../../../hooks/useLatestGithubRelease'
import { useTypingListEffect } from '../../../hooks/useTypingListEffect'
import { SectionViewedTrack } from '../../../modules/segment'
import { DownloadButton } from '../../Buttons/DownloadButton'
import { DownloadOptions } from '../../Landing/DownloadOptions'
import type { CreatorsHeroProps } from './CreatorsHero.types'
import {
  CreatorsHeroActionsContainer,
  CreatorsHeroContent,
  CreatorsHeroImageContainer,
  CreatorsHeroSection,
  CreatorsHeroSubtitle,
  CreatorsHeroTextContainer,
  CreatorsHeroTitle,
  CreatorsHeroVideo,
  CreatorsHeroWrapper
} from './CreatorsHero.styled'

const CreatorsHero = memo(({ item, isDesktop }: CreatorsHeroProps) => {
  const l = useFormatMessage()
  const trackClick = useTrackClick()
  const currentWord = useTypingListEffect(item.changingWord.length > 0 ? item.changingWord : [''])
  const { links, loading: isLoadingLinks } = useLatestGithubRelease(Repo.CREATOR_HUB)
  const [isLoadingUserAgentData, userAgentData] = useAdvancedUserAgentData()

  const imageLandscapeOptimized = useImageOptimization(item.imageLandscape.url)
  const imagePortraitOptimized = useImageOptimization(item.imagePortrait.url)
  const videoLandscapeOptimized = useVideoOptimization(item.videoLandscape?.url)
  const videoPortraitOptimized = useVideoOptimization(item.videoPortrait?.url)

  const sectionRef = useRef<HTMLElement>(null)
  const [isSectionInView, setIsSectionInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsSectionInView(true)
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <CreatorsHeroSection ref={sectionRef}>
      <CreatorsHeroWrapper>
        <CreatorsHeroTextContainer>
          <CreatorsHeroTitle variant="h1">
            {item.titleFirstLine}
            <br />
            <span>{currentWord}</span>
            <br />
            {item.titleLastLine}
          </CreatorsHeroTitle>
          <CreatorsHeroSubtitle variant="body1">{item.subtitle}</CreatorsHeroSubtitle>
          <CreatorsHeroActionsContainer>
            {isDesktop && !isLoadingLinks && links && !isLoadingUserAgentData && (
              <DownloadOptions
                userAgentData={userAgentData}
                links={links}
                redirectPath="/download/creator-hub-success"
                label={l('page.download.download_creator_hub')}
                alternativeText={l('component.creators_landing.hero.also_available_on')}
                hideLogo
                center
                withoutIdentity
              />
            )}
            {!isDesktop && (
              <DownloadButton
                href="https://studio.decentraland.org"
                onClick={e => {
                  e.preventDefault()
                  trackClick(e)
                }}
                label={l('page.download.download_creator_hub')}
                place={SectionViewedTrack.CREATORS_HERO}
              />
            )}
          </CreatorsHeroActionsContainer>
        </CreatorsHeroTextContainer>
        <CreatorsHeroContent>
          {isDesktop && (
            <>
              {item.videoLandscape?.url && (
                <CreatorsHeroVideo
                  loop
                  muted
                  play={isSectionInView}
                  preload={isSectionInView ? 'metadata' : 'none'}
                  playsInline={true}
                  width={item.videoLandscape.width}
                  height={item.videoLandscape.height}
                  poster={
                    (isWebpSupported() && imageLandscapeOptimized.webp) || imageLandscapeOptimized.jpg || imageLandscapeOptimized.optimized
                  }
                  isInView={isSectionInView}
                  source={videoLandscapeOptimized || item.videoLandscape.url}
                  type={item.videoLandscape.mimeType}
                />
              )}
              {item.imageLandscape?.url && (
                <CreatorsHeroImageContainer
                  imageUrl={
                    (isWebpSupported() && imageLandscapeOptimized.webp) || imageLandscapeOptimized.jpg || imageLandscapeOptimized.optimized
                  }
                />
              )}
            </>
          )}
          {!isDesktop && (
            <>
              {item.videoPortrait?.url && (
                <CreatorsHeroVideo
                  loop
                  muted
                  play={isSectionInView}
                  preload={isSectionInView ? 'metadata' : 'none'}
                  playsInline={true}
                  width={item.videoPortrait.width}
                  height={item.videoPortrait.height}
                  poster={
                    (isWebpSupported() && imagePortraitOptimized.webp) || imagePortraitOptimized.jpg || imagePortraitOptimized.optimized
                  }
                  isInView={isSectionInView}
                  source={videoPortraitOptimized || item.videoPortrait.url}
                  type={item.videoPortrait.mimeType}
                />
              )}
              {item.imagePortrait?.url && (
                <CreatorsHeroImageContainer
                  imageUrl={
                    (isWebpSupported() && imagePortraitOptimized.webp) || imagePortraitOptimized.jpg || imagePortraitOptimized.optimized
                  }
                />
              )}
            </>
          )}
        </CreatorsHeroContent>
      </CreatorsHeroWrapper>
    </CreatorsHeroSection>
  )
})

export { CreatorsHero }
export type { CreatorsHeroProps }
