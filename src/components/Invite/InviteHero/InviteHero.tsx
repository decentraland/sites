import { Suspense, lazy, memo, useCallback, useEffect, useState } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { AnimatedBackground } from 'decentraland-ui2'
import { useVideoOptimization } from '../../../hooks/contentful'
import { useFeatureFlagContext } from '../../../hooks/useFeatureFlagContext'
import { useReferralUrl } from '../../../hooks/useReferralUrl'
import envelopeImageAsset from '../../../images/referral-envelope.webp'
import { BannerButton } from '../../Buttons/BannerButton'
import type { InviteHeroProps } from './InviteHero.types'
import {
  AvatarContainer,
  AvatarWrapper,
  EnvelopeImage,
  EnvelopeImageContainer,
  EnvelopeShadow,
  HeroActionsContainer,
  HeroContainer,
  HeroContent,
  HeroOverlayVideo,
  HeroSection,
  HeroSubTitle,
  HeroTextContainer,
  HeroTextWrapper,
  HeroTitle,
  HeroVideo
} from './InviteHero.styled'

const processTitleWithGradient = (title: string) => {
  if (!title) return title

  const decentralandRegex = /Decentraland/i
  const match = title.match(decentralandRegex)

  if (!match) {
    return title
  }

  const index = match.index!
  const before = title.substring(0, index)
  const after = title.substring(index + 'Decentraland'.length)

  return (
    <>
      {before}
      <span className="decentraland-gradient">Decentraland</span>
      {after}
    </>
  )
}

const WearablePreviewLazy = lazy(() =>
  import('decentraland-ui2/dist/components/WearablePreview/WearablePreview').then(m => ({
    default: m.WearablePreview as React.ComponentType<Record<string, unknown>>
  }))
)

const InviteHero = memo((props: InviteHeroProps) => {
  const { title, subtitle, media, buttonLabel, eventPlace, referrer, isDesktop, isSecondaryHero, isLoading } = props

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const referrerAddress = referrer?.avatars?.[0]?.ethAddress
  const referrerName = referrer?.avatars?.[0]?.name

  const analytics = useAnalytics()
  const urlWithReferrer = useReferralUrl(referrerAddress)

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      event.preventDefault()
      analytics.track('Click', { section: eventPlace })
      setTimeout(() => {
        window.location.href = urlWithReferrer
      }, 500)
    },
    [analytics, eventPlace, urlWithReferrer]
  )

  const [, { loading: featureFlagsLoading }] = useFeatureFlagContext()

  const videoLandscapeOptimized = useVideoOptimization(media.videoLandscape?.url)
  const videoPortraitOptimized = useVideoOptimization(media.videoPortrait?.url)

  const processedTitle = processTitleWithGradient(title)

  return (
    <HeroSection isSecondaryHero={isSecondaryHero}>
      <HeroContainer>
        <HeroTextContainer>
          <HeroTextWrapper>
            {isDesktop && !isSecondaryHero && (
              <EnvelopeImageContainer>
                <EnvelopeShadow />
                <EnvelopeImage src={envelopeImageAsset} alt="Envelope" loading="eager" width={115} height={115} />
              </EnvelopeImageContainer>
            )}
            <HeroTitle {...({ component: isSecondaryHero ? 'h2' : 'h1' } as Record<string, unknown>)}>
              {!isLoading && !isSecondaryHero && referrerName} {processedTitle}
            </HeroTitle>
            <HeroSubTitle variant="h4">{subtitle}</HeroSubTitle>
          </HeroTextWrapper>
          <HeroActionsContainer>
            <BannerButton
              href={urlWithReferrer}
              onClick={handleClick}
              label={buttonLabel}
              eventPlace={eventPlace}
              metadata={{ title: '', subtitle: '' }}
            />
          </HeroActionsContainer>
        </HeroTextContainer>
        <HeroContent>
          <AnimatedBackground variant="absolute" />
          {isSecondaryHero && <HeroOverlayVideo />}

          {(videoLandscapeOptimized || videoPortraitOptimized) && (
            <HeroVideo
              loop
              muted
              autoPlay
              playsInline={true}
              source={!isDesktop && videoPortraitOptimized ? videoPortraitOptimized : videoLandscapeOptimized!}
            />
          )}
          <AvatarContainer>
            {!isDesktop && !isSecondaryHero && (
              <EnvelopeImageContainer>
                <EnvelopeShadow />
                <EnvelopeImage src={envelopeImageAsset} alt="Envelope" loading="eager" width={160} height={160} />
              </EnvelopeImageContainer>
            )}
            <AvatarWrapper>
              {isClient && !isLoading && !isSecondaryHero && !featureFlagsLoading && (
                <Suspense fallback={null}>
                  <WearablePreviewLazy profile={referrerAddress} lockBeta disableBackground background="transparent" />
                </Suspense>
              )}
            </AvatarWrapper>
          </AvatarContainer>
        </HeroContent>
      </HeroContainer>
    </HeroSection>
  )
})

export { InviteHero }
