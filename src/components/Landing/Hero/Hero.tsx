import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { CDNSource, JumpInIcon, getCDNRelease, muiIcons } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { isWebpSupported, useImageOptimization, useVideoOptimization } from '../../../hooks/contentful'
import { useFeatureFlagContext } from '../../../hooks/useFeatureFlagContext'
import { ExplorerDownloads } from '../../../modules/explorerDownloads'
import { FEATURE_FLAG, OnboardingFlowVariant } from '../../../modules/ff'
import { formatToShorthand } from '../../../modules/number'
import { SectionViewedTrack } from '../../../modules/segment'
import { sanitizeCDNReleaseLinks } from '../../../modules/url'
import { normalizeUserAgentArchitectureByOs } from '../../../modules/userAgent'
import { DownloadButton } from '../../Buttons/DownloadButton'
import { VerifiedIcon } from '../../Icon/VerifiedIcon'
import { DownloadOptions } from '../DownloadOptions'
import { DownloadCounts } from '../DownloadOptions/DownloadOptions.styled'
import { OperativeSystem } from '../DownloadOptions/DownloadOptions.types'
import { HeroComponentProps } from './Hero.types'
import {
  HeroActionsContainer,
  HeroActionsWrapper,
  HeroAlreadyUserContainer,
  HeroAlreadyUserLink,
  HeroButtonContainer,
  HeroContainer,
  HeroContent,
  HeroContentLoading,
  HeroImageContainer,
  HeroSection,
  HeroSubtitle,
  HeroTextContainer,
  HeroTitle,
  HeroVideo,
  HeroWrapper
} from './Hero.styled'

const FileDownloadOutlinedIcon = muiIcons.FileDownloadOutlined

const Hero = memo((props: HeroComponentProps) => {
  const { isDesktop, hideNavbar, isLoggedIn, isLoading } = props
  const { title, subtitle, imageLandscape, videoLandscape, imagePortrait, videoPortrait, id } = props.hero

  const [ff, { loading: featureFlagsLoading }] = useFeatureFlagContext()

  const [isOnboardingFlowV2, setIsOnboardingFlowV2] = useState(false)
  const [isOnboardingFlowReady, setIsOnboardingFlowReady] = useState(false)

  const trackClick = useTrackClick()

  useEffect(() => {
    const checkOnboardingFlowV2 = async () => {
      const searchParams = new URLSearchParams(window.location.search)
      const flowParam = searchParams.get('flow')

      if (flowParam === 'V1') {
        setIsOnboardingFlowReady(true)
        return
      }

      if (flowParam === 'V2') {
        setIsOnboardingFlowV2(true)
        setIsOnboardingFlowReady(true)
        return
      }

      if (featureFlagsLoading) {
        return
      }

      const onboardingVariant = ff.variants[FEATURE_FLAG.onboardingFlow] as { name?: string } | undefined
      setIsOnboardingFlowV2(onboardingVariant?.name === OnboardingFlowVariant.V2)
      setIsOnboardingFlowReady(true)
    }
    checkOnboardingFlowV2()
  }, [ff.variants[FEATURE_FLAG.onboardingFlow], featureFlagsLoading])

  const l = useFormatMessage()

  const onboardingUrl = getEnv('ONBOARDING_URL')!

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      trackClick(event)
      setTimeout(() => {
        window.location.href = onboardingUrl
      }, 500)
    },
    [onboardingUrl, trackClick]
  )

  const links = useMemo(() => sanitizeCDNReleaseLinks(getCDNRelease(CDNSource.LAUNCHER)) || {}, [])

  const [isLoadingUserAgentData, userAgentData] = useAdvancedUserAgentData()

  const [downloads, downloadsStatus] = useAsyncMemo(async () => ExplorerDownloads.get().getTotalDownloads(), [])

  const searchParams = new URLSearchParams(window.location.search)
  const os = searchParams.get('os')

  useEffect(() => {
    if (userAgentData && os) {
      normalizeUserAgentArchitectureByOs(userAgentData, os as OperativeSystem)
    }
  }, [userAgentData, os])

  const [sectionInView, isSectionInView] = useInView({ threshold: 0.1 })

  const imageLandscapeOptimized = useImageOptimization(imageLandscape.url)
  const imagePortraitOptimized = useImageOptimization(imagePortrait.url)
  const videoLandscapeOptimized = useVideoOptimization(videoLandscape?.url)
  const videoPortraitOptimized = useVideoOptimization(videoPortrait?.url)

  return (
    <HeroSection hideNavbar={hideNavbar}>
      <HeroContainer ref={sectionInView}>
        <HeroWrapper data-index={id}>
          <HeroTextContainer>
            <HeroTitle variant="h1">{title}</HeroTitle>
            <HeroSubtitle variant="h3" sx={{ typography: { sm: 'h4' } }}>
              {subtitle.text}
            </HeroSubtitle>

            <HeroActionsContainer>
              {!featureFlagsLoading && isOnboardingFlowReady && !isLoggedIn && isOnboardingFlowV2 && (
                <HeroActionsWrapper>
                  <HeroButtonContainer>
                    <DownloadButton
                      href={onboardingUrl}
                      onClick={handleClick}
                      label={l('component.landing.hero.create_your_avatar')}
                      place={SectionViewedTrack.LANDING_HERO}
                      isFullWidth
                      isLoading={isLoadingUserAgentData || isLoading}
                      endIcon={<JumpInIcon fontSize="large" />}
                    />
                  </HeroButtonContainer>
                  {isDesktop && userAgentData && (
                    <HeroAlreadyUserContainer>
                      {l('component.landing.hero.already_user', {
                        download: (
                          <HeroAlreadyUserLink href={`${getEnv('DOWNLOAD_SUCCESS_URL')}?os=${userAgentData.os.name}`}>
                            {l('component.landing.hero.download')} <FileDownloadOutlinedIcon fontSize="large" />
                          </HeroAlreadyUserLink>
                        )
                      })}
                    </HeroAlreadyUserContainer>
                  )}
                  {!downloadsStatus.loading && downloadsStatus.loaded && (
                    <DownloadCounts variant="body1">
                      <VerifiedIcon fontStyle="#fff" />{' '}
                      {l('page.download.total_downloads', {
                        downloads: formatToShorthand(downloads || 0)
                      })}
                    </DownloadCounts>
                  )}
                </HeroActionsWrapper>
              )}
              {!featureFlagsLoading &&
                isOnboardingFlowReady &&
                !isLoadingUserAgentData &&
                (isLoggedIn || (!isLoggedIn && !isOnboardingFlowV2)) && (
                  <DownloadOptions
                    userAgentData={userAgentData}
                    links={links}
                    redirectPath={getEnv('DOWNLOAD_SUCCESS_URL')}
                    hideLogo
                    downloadCounts={!downloadsStatus.loading && downloadsStatus.loaded && formatToShorthand(downloads || 0)}
                  />
                )}
            </HeroActionsContainer>
          </HeroTextContainer>
          <HeroContent>
            <HeroContentLoading />
            {isDesktop && (
              <>
                {videoLandscape && (
                  <HeroVideo
                    loop
                    muted
                    play={isSectionInView}
                    preload={isSectionInView ? 'metadata' : 'none'}
                    playsInline={true}
                    width={videoLandscape.width}
                    height={videoLandscape.height}
                    poster={
                      (isWebpSupported() && imageLandscapeOptimized.webp) ||
                      imageLandscapeOptimized.jpg ||
                      imageLandscapeOptimized.optimized
                    }
                    isInView={isSectionInView}
                    source={videoLandscapeOptimized || videoLandscape.url}
                    type={videoLandscape.mimeType}
                  />
                )}
                {imageLandscape && (
                  <HeroImageContainer
                    imageUrl={
                      (isWebpSupported() && imageLandscapeOptimized.webp) ||
                      imageLandscapeOptimized.jpg ||
                      imageLandscapeOptimized.optimized
                    }
                  />
                )}
              </>
            )}
            {!isDesktop && (
              <>
                {videoPortrait && (
                  <HeroVideo
                    loop
                    muted
                    play={isSectionInView}
                    preload={isSectionInView ? 'metadata' : 'none'}
                    playsInline={true}
                    width={videoPortrait.width}
                    height={videoPortrait.height}
                    poster={
                      (isWebpSupported() && imagePortraitOptimized.webp) || imagePortraitOptimized.jpg || imagePortraitOptimized.optimized
                    }
                    isInView={isSectionInView}
                    source={videoPortraitOptimized || videoPortrait.url}
                    type={videoPortrait.mimeType}
                  />
                )}
                {imagePortrait && (
                  <HeroImageContainer
                    imageUrl={
                      (isWebpSupported() && imagePortraitOptimized.webp) || imagePortraitOptimized.jpg || imagePortraitOptimized.optimized
                    }
                  />
                )}
              </>
            )}
          </HeroContent>
        </HeroWrapper>
      </HeroContainer>
    </HeroSection>
  )
})

export { Hero }
