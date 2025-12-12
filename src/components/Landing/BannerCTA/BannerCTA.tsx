import { memo, useCallback, useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { useInView } from 'react-intersection-observer'
import { JumpIn } from 'decentraland-ui2'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { isWebpSupported, useImageOptimization, useVideoOptimization } from '../../../hooks/contentful'
import { useFeatureFlagContext } from '../../../hooks/useFeatureFlagContext'
import { FEATURE_FLAG, OnboardingFlowVariant } from '../../../modules/ff'
import { checkWebGpuSupport } from '../../../modules/webgpu'
import { BannerButton } from '../../Buttons/BannerButton'
import { BannerCTAProps } from './BannerCTA.types'
import {
  BannerCTAActionsContainer,
  BannerCTAContainer,
  BannerCTAContent,
  BannerCTAImageContainer,
  BannerCTAJumpInWrapper,
  BannerCTASection,
  BannerCTASubTitle,
  BannerCTATextContainer,
  BannerCTATextWrapper,
  BannerCTATitle,
  BannerCTAVideo
} from './BannerCTA.styled'

const BannerCTA = memo((props: BannerCTAProps) => {
  const {
    title,
    subtitle,
    imageLandscape,
    videoLandscape,
    imagePortrait,
    videoPortrait,
    buttonLabel,
    url,
    textPosition,
    titlePosition,
    id,
    eventPlace,
    isDesktop,
    isLoggedIn
  } = props

  const l = useFormatMessage()

  const handleMainCTA = useTrackClick()

  const [ff, { loading: featureFlagsLoading }] = useFeatureFlagContext()

  const [isOnboardingFlowV2, setIsOnboardingFlowV2] = useState(false)

  useEffect(() => {
    const checkOnboardingFlowV2 = async () => {
      const isWebGpuSupported = await checkWebGpuSupport()
      const onboardingVariant = ff.variants[FEATURE_FLAG.onboardingFlow] as { name?: string } | undefined
      setIsOnboardingFlowV2(!featureFlagsLoading && onboardingVariant?.name === OnboardingFlowVariant.V2 && isWebGpuSupported)
    }
    checkOnboardingFlowV2()
  }, [ff.variants[FEATURE_FLAG.onboardingFlow], featureFlagsLoading])

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      event.preventDefault()
      handleMainCTA(event)
      const href = event.currentTarget instanceof HTMLAnchorElement ? event.currentTarget.href : url
      setTimeout(() => {
        window.location.href = href
      }, 500)
    },
    [handleMainCTA]
  )

  const [sectionInView, isSectionInView] = useInView({ threshold: 0.1 })

  const imageLandscapeOptimized = useImageOptimization(imageLandscape.url)
  const imagePortraitOptimized = useImageOptimization(imagePortrait.url)
  const videoLandscapeOptimized = useVideoOptimization(videoLandscape?.url)
  const videoPortraitOptimized = useVideoOptimization(videoPortrait?.url)

  return (
    <BannerCTASection>
      <BannerCTAContainer ref={sectionInView} isCentered={textPosition === 'center'} data-index={id}>
        <BannerCTATextContainer isCentered={textPosition === 'center'} isInView={isSectionInView}>
          <BannerCTATextWrapper>
            {titlePosition === 'first' && (
              <BannerCTATitle isPositionFirst variant="h1">
                {title}
              </BannerCTATitle>
            )}
            <BannerCTASubTitle isPositionFirst={titlePosition !== 'first'} variant={titlePosition === 'first' ? 'h4' : 'h3'}>
              {subtitle}
            </BannerCTASubTitle>
            {titlePosition === 'center' && <BannerCTATitle variant="h1">{title}</BannerCTATitle>}
          </BannerCTATextWrapper>
          <BannerCTAActionsContainer>
            {!isLoggedIn && isOnboardingFlowV2 && (
              <BannerButton
                href={url}
                onClick={handleClick}
                label={buttonLabel}
                eventPlace={eventPlace}
                metadata={{
                  title: title,
                  subtitle: subtitle
                }}
              />
            )}
            {(isLoggedIn || (!isLoggedIn && !isOnboardingFlowV2)) && (
              <BannerCTAJumpInWrapper>
                <JumpIn
                  variant="button"
                  modalProps={{
                    title: l('component.landing.banner_cta.jump_in.modal_props.title'),
                    description: l('component.landing.banner_cta.jump_in.modal_props.description'),
                    buttonLabel: l('component.landing.banner_cta.jump_in.modal_props.button_label')
                  }}
                  buttonText={
                    textPosition === 'center'
                      ? l('component.landing.banner_cta.jump_in.button_text_jump_in')
                      : l('component.landing.banner_cta.jump_in.button_text_get_started')
                  }
                />
              </BannerCTAJumpInWrapper>
            )}
          </BannerCTAActionsContainer>
        </BannerCTATextContainer>
        <BannerCTAContent>
          {isDesktop && (
            <>
              {videoLandscape && (
                <BannerCTAVideo
                  loop
                  muted
                  autoPlay
                  playsInline={true}
                  webkit-playsinline="true"
                  preload="metadata"
                  width={videoLandscape.width}
                  height={videoLandscape.height}
                  poster={
                    (isWebpSupported() && imageLandscapeOptimized.webp) || imageLandscapeOptimized.jpg || imageLandscapeOptimized.optimized
                  }
                  isInView={isSectionInView}
                  source={videoLandscapeOptimized || videoLandscape.url}
                  type={videoLandscape.mimeType}
                />
              )}
              {imageLandscape && (
                <BannerCTAImageContainer
                  imageUrl={
                    (isWebpSupported() && imageLandscapeOptimized.webp) || imageLandscapeOptimized.jpg || imageLandscapeOptimized.optimized
                  }
                />
              )}
            </>
          )}
          {!isDesktop && (
            <>
              {videoPortrait && (
                <BannerCTAVideo
                  loop
                  muted
                  autoPlay
                  playsInline={true}
                  webkit-playsinline="true"
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
                <BannerCTAImageContainer
                  imageUrl={
                    (isWebpSupported() && imagePortraitOptimized.webp) || imagePortraitOptimized.jpg || imagePortraitOptimized.optimized
                  }
                />
              )}
            </>
          )}
        </BannerCTAContent>
      </BannerCTAContainer>
    </BannerCTASection>
  )
})

export { BannerCTA }
