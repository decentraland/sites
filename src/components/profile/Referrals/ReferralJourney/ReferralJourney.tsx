import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/naming-convention
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { Tooltip, Typography } from 'decentraland-ui2'
import { useFormatMessage } from '../../../../hooks/adapters/useFormatMessage'
import { ReferralRewardCard } from '../ReferralRewardCard'
import { TIERS } from './constants'
import { ANIMATION_DURATION, getTiersCompletedCount } from './utils'
import { AnimationPhase } from './ReferralJourney.types'
import type { ReferralJourneyProps } from './ReferralJourney.types'
import {
  GradientBorder,
  JourneyContainer,
  JourneyStep,
  JourneyStepIcon,
  JourneyStepLine,
  JourneyStepper,
  JourneyWrapper,
  SectionContainer,
  Subtitle,
  SubtitleContainer,
  Title,
  TitleContainer
} from './ReferralJourney.styled'

const ReferralJourney = memo(({ invitedUsersAccepted, invitedUsersAcceptedViewed, rewardImages }: ReferralJourneyProps) => {
  const t = useFormatMessage()
  const [animatedStep, setAnimatedStep] = useState(getTiersCompletedCount(invitedUsersAccepted))
  const [open, setOpen] = useState(false)
  const [journeyTiers, setJourneyTiers] = useState(
    TIERS.map(tier => ({ ...tier, completed: tier.invitesAccepted <= invitedUsersAccepted }))
  )
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>(AnimationPhase.WAITING_NEXT_TIER)
  const [currentTierIndex, setCurrentTierIndex] = useState<number>(-1)
  const totalSteps = TIERS.length
  const journeyStepRefs = useRef<(Element | null)[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)

  const getNextTierIndex = useCallback((): number => {
    return TIERS.findIndex((tier, index) => {
      const isCurrentlyCompleted = tier.invitesAccepted <= invitedUsersAccepted
      const wasCompletedWhenViewed = tier.invitesAccepted <= invitedUsersAcceptedViewed
      const isNewlyCompleted = isCurrentlyCompleted && !wasCompletedWhenViewed

      return isNewlyCompleted && index > currentTierIndex
    })
  }, [invitedUsersAccepted, invitedUsersAcceptedViewed, currentTierIndex])

  const getNewTiersToAnimate = useCallback((): number => {
    const tiersCompletedWhenViewed = getTiersCompletedCount(invitedUsersAcceptedViewed)
    const tiersCompletedNow = getTiersCompletedCount(invitedUsersAccepted)
    return tiersCompletedNow - tiersCompletedWhenViewed
  }, [invitedUsersAccepted, invitedUsersAcceptedViewed])

  const tooltipTitle = useMemo(() => {
    const nextTier = TIERS.find(tier => invitedUsersAccepted < tier.invitesAccepted) ?? null

    if (!nextTier) {
      return <Typography>{t('profile.referral_journey.tooltip_title', { count: invitedUsersAccepted })}</Typography>
    }

    const friendsNeeded = nextTier.invitesAccepted - invitedUsersAccepted
    return (
      <Typography>
        {t('profile.referral_journey.tooltip_title', { count: invitedUsersAccepted })}
        <br />
        {t('profile.referral_journey.tooltip_subtitle', { count: friendsNeeded })}
      </Typography>
    )
  }, [invitedUsersAccepted, t])

  useEffect(() => {
    setAnimatedStep(getTiersCompletedCount(invitedUsersAccepted))
  }, [invitedUsersAccepted])

  useEffect(() => {
    const newTiersToAnimate = getNewTiersToAnimate()
    if (newTiersToAnimate <= 0) return

    const nextTierIndex = getNextTierIndex()
    if (animationPhase === AnimationPhase.WAITING_NEXT_TIER && !open && nextTierIndex !== -1) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setAnimationPhase(AnimationPhase.TIER_REACHED)
      setAnimatedStep(nextTierIndex + 1)
      setCurrentTierIndex(nextTierIndex)
    }
  }, [
    animatedStep,
    totalSteps,
    animationPhase,
    open,
    invitedUsersAccepted,
    invitedUsersAcceptedViewed,
    currentTierIndex,
    getNewTiersToAnimate,
    getNextTierIndex
  ])

  useEffect(() => {
    if (animationPhase !== AnimationPhase.TIER_REACHED) return

    const timeout = setTimeout(() => setOpen(true), ANIMATION_DURATION)
    return () => clearTimeout(timeout)
  }, [animationPhase])

  useEffect(() => {
    if (animatedStep > 1 && journeyStepRefs.current[animatedStep - 1]) {
      journeyStepRefs.current[animatedStep - 1]?.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      })
    }

    setJourneyTiers(TIERS.map(tier => ({ ...tier, completed: tier.invitesAccepted <= invitedUsersAccepted })))
  }, [animatedStep, invitedUsersAccepted])

  const shouldShowAnimation = useCallback(
    (tierIndex: number): boolean => {
      const tier = TIERS[tierIndex]
      const isNewlyCompleted = tier.invitesAccepted <= invitedUsersAccepted && tier.invitesAccepted > invitedUsersAcceptedViewed
      const isCurrentlyAnimating = animationPhase === AnimationPhase.TIER_REACHED && animatedStep === tierIndex + 1
      return isNewlyCompleted && isCurrentlyAnimating
    },
    [invitedUsersAccepted, invitedUsersAcceptedViewed, animationPhase, animatedStep]
  )

  const shouldShowIcon = useCallback(
    (tierIndex: number): boolean => {
      const tier = TIERS[tierIndex]
      const isCompleted = tier.invitesAccepted <= invitedUsersAccepted
      const isCurrentlyAnimating = animationPhase === AnimationPhase.TIER_REACHED && animatedStep === tierIndex + 1
      return isCompleted || isCurrentlyAnimating
    },
    [invitedUsersAccepted, animationPhase, animatedStep]
  )

  return (
    <SectionContainer ref={sectionRef}>
      <TitleContainer>
        <Title variant="h4">{t('profile.referral_journey.title')}</Title>
        <SubtitleContainer>
          <Subtitle variant="h6">🤍 {t('profile.referral_journey.invites_accepted', { count: invitedUsersAccepted })}</Subtitle>
        </SubtitleContainer>
      </TitleContainer>
      <JourneyContainer>
        <JourneyWrapper>
          <JourneyStepper>
            <Tooltip title={tooltipTitle} followCursor arrow>
              <JourneyStepLine
                activeStep={animatedStep}
                totalSteps={totalSteps}
                phase={animationPhase}
                invitedUsersAccepted={
                  animationPhase === AnimationPhase.TIER_REACHED
                    ? TIERS[animatedStep - 1]?.invitesAccepted ?? invitedUsersAccepted
                    : invitedUsersAccepted
                }
              />
            </Tooltip>
            {journeyTiers.map((tier, i) => (
              <JourneyStep key={i} ref={(el: Element | null) => (journeyStepRefs.current[i] = el)}>
                <GradientBorder completed={tier.completed} showAnimation={shouldShowAnimation(i)}>
                  <JourneyStepIcon>{shouldShowIcon(i) && <CheckRoundedIcon fontSize="medium" />}</JourneyStepIcon>
                </GradientBorder>
                <ReferralRewardCard
                  {...tier}
                  image={rewardImages?.find(reward => reward.tier === tier.invitesAccepted)?.url || tier.image}
                />
              </JourneyStep>
            ))}
          </JourneyStepper>
        </JourneyWrapper>
      </JourneyContainer>
    </SectionContainer>
  )
})

export { ReferralJourney }
export type { ReferralJourneyProps }
