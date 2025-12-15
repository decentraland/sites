import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useAdvancedUserAgentData, useAsyncMemo } from '@dcl/hooks'
import { CDNSource, JumpInIcon, getCDNRelease } from 'decentraland-ui2'
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
import { checkWebGpuSupport } from '../../../modules/webgpu'
import { DownloadButton } from '../../Buttons/DownloadButton'
import { DownloadOptions } from '../DownloadOptions'
import { OperativeSystem } from '../DownloadOptions/DownloadOptions.types'
import { HeroComponentProps } from './Hero.types'
import {
  HeroActionsContainer,
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

const Hero = memo((props: HeroComponentProps) => {
  const { isDesktop, hideNavbar, isLoggedIn, isLoading } = props
  const { title, subtitle, imageLandscape, videoLandscape, imagePortrait, videoPortrait, id } = props.hero

  const [ff, { loading: featureFlagsLoading }] = useFeatureFlagContext()

  const [isOnboardingFlowV2, setIsOnboardingFlowV2] = useState(false)

  const trackClick = useTrackClick()

  useEffect(() => {
    const checkOnboardingFlowV2 = async () => {
      const isWebGpuSupported = await checkWebGpuSupport()
      const variant = ff.variants[FEATURE_FLAG.onboardingFlow] as { name?: string } | undefined
      setIsOnboardingFlowV2(!featureFlagsLoading && variant?.name === OnboardingFlowVariant.V2 && isWebGpuSupported)
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
              {!featureFlagsLoading && !isLoggedIn && isOnboardingFlowV2 && (
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
              )}
              {!featureFlagsLoading && !isLoadingUserAgentData && (isLoggedIn || (!isLoggedIn && !isOnboardingFlowV2)) && (
                <DownloadOptions
                  userAgentData={userAgentData}
                  links={links}
                  redirectPath={getEnv('VITE_DOWNLOAD_SUCCESS_URL') ?? '/download_success'}
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
                    autoPlay
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
                    autoPlay
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
