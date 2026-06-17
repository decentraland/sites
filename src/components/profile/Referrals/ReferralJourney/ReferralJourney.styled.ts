import { keyframes } from '@emotion/react'
import { Box, Typography, styled } from 'decentraland-ui2'
import { ANIMATION_DURATION, calculateProgressPercentage } from './utils'
import { AnimationPhase } from './ReferralJourney.types'

const shakeAnimation = keyframes`
  0% { transform: scale(1); }
  25% { transform: scale(1.1) rotate(-5deg); }
  50% { transform: scale(1.1) rotate(5deg); }
  75% { transform: scale(1.1) rotate(-5deg); }
  100% { transform: scale(1); }
`

const splashAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 45, 85, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 45, 85, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 45, 85, 0); }
`

const SectionContainer = styled(Box)({
  width: '100%',
  maxWidth: '1605px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '48px 0 0 0',
  position: 'relative'
})

const TitleContainer = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '42px'
})

const Title = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '33.37px',
  lineHeight: '124%',
  letterSpacing: '0px',
  [theme.breakpoints.down('lg')]: {
    fontSize: '24px',
    lineHeight: '133%'
  },
  [theme.breakpoints.down('md')]: {
    fontSize: '20px',
    lineHeight: '160%'
  }
}))

const SubtitleContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'row',
  gap: '8px'
})

const Subtitle = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 1)',
  fontWeight: 500,
  fontSize: '20px',
  lineHeight: '160%',
  letterSpacing: '0px',
  [theme.breakpoints.down('md')]: {
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '175%'
  }
}))

const JourneyContainer = styled(Box)({
  overflowX: 'auto',
  width: '100%',
  paddingBottom: '40px'
})

const JourneyWrapper = styled(Box)({
  width: 'fit-content',
  margin: '0 auto'
})

const JourneyStepper = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  zIndex: 1,
  paddingTop: '10px'
})

const JourneyStepLine = styled(Box, {
  shouldForwardProp: prop => prop !== 'activeStep' && prop !== 'totalSteps' && prop !== 'phase' && prop !== 'invitedUsersAccepted'
})<{
  activeStep: number
  totalSteps: number
  phase: AnimationPhase
  invitedUsersAccepted: number
}>(({ activeStep, totalSteps, phase, invitedUsersAccepted, theme }) => {
  const percent = calculateProgressPercentage(totalSteps, invitedUsersAccepted)
  const isInitialState = activeStep === 0 && phase === AnimationPhase.TIER_REACHED

  return {
    flex: '1',
    height: '12px',
    borderRadius: '52px',
    background: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
    top: '20px',
    left: '0',
    right: '0',
    width: '100%',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&:after': {
      content: '""',
      position: 'absolute',
      top: '0',
      left: '0',
      width: isInitialState ? '2%' : `${percent}%`,
      height: '100%',
      borderRadius: '52px',
      background: 'linear-gradient(81.97deg, #FF2D55 -12.48%, #FFBC5B 82.49%)',
      transition: theme.transitions.create(['width'], {
        duration: `${ANIMATION_DURATION / 2}ms`,
        easing: theme.transitions.easing.sharp
      })
    }
  }
})

const JourneyStep = styled(Box)({
  width: '163.67px',
  marginRight: '16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:nth-of-type(2)': {
    marginLeft: '4px'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:last-child': {
    marginRight: '0'
  }
})

const GradientBorder = styled(Box, { shouldForwardProp: prop => prop !== 'completed' && prop !== 'showAnimation' })<{
  completed: boolean
  showAnimation: boolean
}>(({ completed, showAnimation }) => ({
  borderRadius: '8px',
  padding: '1px',
  background: completed ? 'linear-gradient(243.96deg, #FF2D55 -11.67%, #FFBC5B 88.23%)' : 'rgba(255, 255, 255, 0.7)',
  display: 'inline-block',
  boxShadow: completed ? '0 0 0 2px #FF2D5544' : 'none',
  width: '32px',
  height: '32px',
  overflow: 'hidden',
  zIndex: 2,
  position: 'relative',
  animation: showAnimation
    ? `${shakeAnimation} ${ANIMATION_DURATION}ms ease-in-out, ${splashAnimation} ${ANIMATION_DURATION}ms ease-out`
    : 'none',
  animationIterationCount: showAnimation ? 1 : 'none'
}))

const JourneyStepIcon = styled(Box)({
  width: '100%',
  height: '100%',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(60, 28, 75, 1)'
})

export {
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
}
