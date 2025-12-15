import { createElement, memo, useCallback, useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { ExpandMoreSharp as expandMoreSharpIcon } from '@mui/icons-material'
import { useTabletAndBelowMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { JumpIn } from 'decentraland-ui2'
import { getEnv } from '../../../config/env'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { useTrackClick } from '../../../hooks/adapters/useTrackLinkContext'
import { useFeatureFlagContext } from '../../../hooks/useFeatureFlagContext'
import { FEATURE_FLAG, OnboardingFlowVariant } from '../../../modules/ff'
import { SectionViewedTrack } from '../../../modules/segment'
import { checkWebGpuSupport } from '../../../modules/webgpu'
import { BannerButton } from '../../Buttons/BannerButton'
import { MissionType, MissionsDetailProps } from './Missions.types'
import {
  MissionActionsContainer,
  MissionButtonBottom,
  MissionDescription,
  MissionDetailContainer,
  MissionDetailWrapper,
  MissionJumpInWrapper,
  MissionTextContainer,
  MissionTitle
} from './MissionDetail.styled'

const MissionDetail = memo((props: MissionsDetailProps) => {
  const { title, description, buttonLabel, buttonLink, buttonType, isSectionInView, isLoggedIn, id } = props

  const handleMainCTA = useTrackClick()

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      event.preventDefault()
      handleMainCTA(event)
      const href = event.currentTarget instanceof HTMLAnchorElement ? event.currentTarget.href : getEnv('ONBOARDING_URL')!
      setTimeout(() => {
        window.location.href = href
      }, 500)
    },
    [handleMainCTA]
  )
  const l = useFormatMessage()
  const isTabletAndBelow = useTabletAndBelowMediaQuery()

  const [ff, { loading: featureFlagsLoading }] = useFeatureFlagContext()

  const [isOnboardingFlowV2, setIsOnboardingFlowV2] = useState(false)

  useEffect(() => {
    const checkOnboardingFlowV2 = async () => {
      const isWebGpuSupported = await checkWebGpuSupport()
      const variant = ff.variants[FEATURE_FLAG.onboardingFlow] as { name?: string } | undefined
      setIsOnboardingFlowV2(!featureFlagsLoading && variant?.name === OnboardingFlowVariant.V2 && isWebGpuSupported)
    }
    checkOnboardingFlowV2()
  }, [ff.variants[FEATURE_FLAG.onboardingFlow], featureFlagsLoading])

  return (
    <MissionDetailContainer isInView={isSectionInView}>
      <MissionDetailWrapper isInView={isSectionInView} missionId={id as MissionType}>
        <MissionTextContainer isInView={isSectionInView}>
          <MissionTitle variant="h2">{title}</MissionTitle>
          <MissionDescription variant="h6">{description.description}</MissionDescription>
        </MissionTextContainer>
        <MissionActionsContainer isInView={isSectionInView}>
          {buttonType === 'primary' && !isLoggedIn && isOnboardingFlowV2 && (
            <MissionJumpInWrapper>
              <BannerButton
                variant="contained"
                color={buttonType}
                href={getEnv('ONBOARDING_URL')!}
                onClick={handleClick}
                label={l('component.landing.missions.jump_in')}
                eventPlace={SectionViewedTrack.LANDING_MISSIONS}
                metadata={{
                  title: String(l('component.landing.missions.jump_in')),
                  subSection: id
                }}
              />
            </MissionJumpInWrapper>
          )}
          {buttonType === 'primary' && (isLoggedIn || (!isLoggedIn && !isOnboardingFlowV2)) && (
            <MissionJumpInWrapper>
              <JumpIn
                variant="button"
                modalProps={{
                  title: l('component.landing.missions.title'),
                  description: l('component.landing.missions.description'),
                  buttonLabel: l('component.landing.missions.button_label')
                }}
              />
            </MissionJumpInWrapper>
          )}
          {buttonType !== 'primary' && (
            <BannerButton
              variant="outlined"
              color={buttonType}
              href={buttonLink}
              onClick={handleClick}
              label={buttonLabel}
              eventPlace={SectionViewedTrack.LANDING_MISSIONS}
              metadata={{
                title,
                subSection: id
              }}
            />
          )}
          {isTabletAndBelow && <MissionButtonBottom>{createElement(expandMoreSharpIcon, { fontSize: 'inherit' })}</MissionButtonBottom>}
        </MissionActionsContainer>
      </MissionDetailWrapper>
    </MissionDetailContainer>
  )
})

export { MissionDetail }
