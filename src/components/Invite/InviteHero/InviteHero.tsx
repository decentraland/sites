import { Suspense, lazy, memo, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatedBackground } from 'decentraland-ui2'
import { useInviteDirectDownload } from '../../../features/invite/invite.flags'
import { getInviterName } from '../../../features/invite/invite.helpers'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
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
  GradientText,
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

/** Grace period that lets the click event flush before the page unloads. */
const TRACK_FLUSH_DELAY_MS = 500
/** Longest the CTA will wait for the referrer to resolve before giving up on it. */
const REFERRER_WAIT_BUDGET_MS = 1200

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
      <GradientText>Decentraland</GradientText>
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
  const { title, subtitle, media, buttonLabel, eventPlace, referrer, referrerAddress, isDesktop, isSecondaryHero, isLoading } = props
  const { isReferrerResolving: isReferrerResolvingProp } = props

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const referrerName = getInviterName(referrer)

  const trackClick = useTrackClick()
  // Direct download only on desktop (mobile keeps the auth-login-first flow) and
  // behind the env gate + remote flag (default off until the flag loads).
  const inviteDirectDownload = useInviteDirectDownload()
  const directDownload = inviteDirectDownload && isDesktop
  const urlWithReferrer = useReferralUrl(referrerAddress ?? undefined, directDownload)

  // Read the URL through a ref so the deferred navigation below always leaves
  // with the latest resolved referrer, not the one captured at click time.
  const urlWithReferrerRef = useRef(urlWithReferrer)
  urlWithReferrerRef.current = urlWithReferrer

  const [clickedAt, setClickedAt] = useState<number | null>(null)
  // Only the address gates the navigation — the profile lookup behind `isLoading`
  // is cosmetic and must never hold the CTA.
  const isResolvingReferrer = !!isReferrerResolvingProp

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      event.preventDefault()
      trackClick(event)
      setClickedAt(Date.now())
    },
    [trackClick]
  )

  useEffect(() => {
    if (clickedAt === null) return

    const elapsed = Date.now() - clickedAt
    // Hold the navigation while the referrer is still resolving: leaving now
    // would hit auth without a `referrer` param and the referral would never be
    // recorded. Capped so a slow catalyst can't strand the CTA.
    const isWaitingForReferrer = isResolvingReferrer && elapsed < REFERRER_WAIT_BUDGET_MS
    const delay = isWaitingForReferrer ? REFERRER_WAIT_BUDGET_MS - elapsed : Math.max(0, TRACK_FLUSH_DELAY_MS - elapsed)

    const timeout = setTimeout(() => {
      setClickedAt(null)
      window.location.href = urlWithReferrerRef.current
    }, delay)

    return () => clearTimeout(timeout)
  }, [clickedAt, isResolvingReferrer])

  const [, { loading: featureFlagsLoading }] = useFeatureFlagContext()

  const videoLandscapeOptimized = useVideoOptimization(media.videoLandscape?.url)
  const videoPortraitOptimized = useVideoOptimization(media.videoPortrait?.url)

  const processedTitle = processTitleWithGradient(title)

  return (
    <HeroSection>
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
                  <WearablePreviewLazy profile={referrerAddress ?? undefined} lockBeta disableBackground background="transparent" />
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
