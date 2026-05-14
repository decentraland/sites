import { Box, Button, Link, TextField, Typography, styled } from 'decentraland-ui2'

const SectionContainer = styled(Box)({
  width: '100%',
  maxWidth: '1605px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '48px 0 0 0',
  position: 'relative',
  borderBottom: '0.5px solid rgba(160, 155, 168, 1)'
})

const EnvelopeImageContainer = styled(Box)({
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative'
})

const EnvelopeShadow = styled('div')({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  borderRadius: '50%',
  width: '100px',
  height: '100px',
  zIndex: 0,
  background: 'radial-gradient(circle, rgba(255,180,216,1) 0%, rgba(255,0,200,1) 50%, rgba(145,0,255,1) 80%, transparent 100%)',
  filter: 'blur(40px)'
})

const EnvelopeImage = styled('img')({
  width: '80px',
  height: '80px',
  objectFit: 'contain',
  position: 'relative',
  zIndex: 1
})

const HeroWrapper = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative'
})

const Title = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  textAlign: 'center',
  marginBottom: '12px',
  color: theme.palette.text.primary,
  fontSize: '48px',
  [theme.breakpoints.down('md')]: {
    fontSize: '32px'
  },
  [theme.breakpoints.down('xs')]: {
    fontSize: '20px'
  }
}))

const Subtitle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '40px',
  gap: '8px',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiSvgIcon-root': {
    fontSize: '22px',
    marginLeft: '4px'
  },
  fontSize: '24px',
  [theme.breakpoints.down('md')]: {
    fontSize: '20px'
  },
  [theme.breakpoints.down('xs')]: {
    fontSize: '16px'
  }
}))

const TooltipLink = styled(Link)({
  color: '#fff',
  textDecoration: 'underline',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    color: '#fff',
    textDecoration: 'underline'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:active': {
    color: '#fff',
    textDecoration: 'underline'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:focus': {
    color: '#fff',
    textDecoration: 'underline'
  }
})

const HowItWorksButton = styled(Button)({
  marginTop: '24px',
  marginBottom: '16px',
  alignItems: 'center',
  color: '#fff',
  fontWeight: 500,
  fontSize: '20px',
  lineHeight: '160%',
  letterSpacing: '0px',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.MuiButton-sizeMedium.MuiButton-textPrimary:not(.Mui-disabled):not(.Mui-focusVisible):hover': {
    background: 'transparent',
    color: '#fff'
  }
})

const StepsContainer = styled(Box, { shouldForwardProp: prop => prop !== 'showSteps' })<{ showSteps?: boolean }>(
  ({ theme, showSteps }) => ({
    display: 'flex',
    gap: '24px',
    justifyContent: 'center',
    marginBottom: showSteps ? '48px' : '0px',
    width: '100%',
    maxWidth: '1264px',
    opacity: showSteps ? 1 : 0,
    maxHeight: showSteps ? '500px' : '0px',
    overflow: 'hidden',
    visibility: showSteps ? 'visible' : 'hidden',
    transform: showSteps ? 'translateY(0)' : 'translateY(20px)',
    transition:
      'opacity 0.5s ease-in-out, transform 0.5s ease-in-out, max-height 0.5s ease-in-out, visibility 0.5s ease-in-out, margin-bottom 0.5s ease-in-out',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }
  })
)

const Step = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '24px',
  minWidth: '260px',
  display: 'flex',
  alignItems: 'flex-start',
  boxShadow: theme.shadows[2],
  [theme.breakpoints.down('sm')]: {
    minWidth: 'unset',
    width: '90%',
    padding: '20px 24px',
    justifyContent: 'space-between'
  }
}))

const StepTextContainer = styled(Box)({
  display: 'flex'
})

const StepNumber = styled(Typography)({
  color: 'rgba(255, 162, 90, 1)',
  fontWeight: 500,
  fontSize: '24px',
  lineHeight: '133%',
  letterSpacing: '0px',
  verticalAlign: 'middle'
})

const StepText = styled(Typography)(({ theme }) => ({
  color: 'rgba(252, 252, 252, 1)',
  textAlign: 'left',
  marginRight: '24px',
  marginLeft: '16px',
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: 400,
  letterSpacing: '0px',
  [theme.breakpoints.down('lg')]: {
    fontSize: '14px',
    lineHeight: '143%',
    letterSpacing: '0px',
    verticalAlign: 'middle'
  }
}))

const StepImage = styled('img')(({ theme }) => ({
  width: '56px',
  height: '56px',
  [theme.breakpoints.down('lg')]: {
    width: '48px',
    height: '48px'
  }
}))

const ReferralContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  width: '100%',
  maxWidth: '520px',
  gap: '12px'
})

const ReferralInput = styled(TextField)(({ theme }) => ({
  width: '100%',
  borderRadius: '8px',
  fontSize: '16px',
  marginRight: '8px',
  height: '40px',
  cursor: 'pointer',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiInputBase-root': {
    background: 'rgba(0, 0, 0, 0.5)',
    height: '40px',
    color: theme.palette.primary.main,
    cursor: 'pointer'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .MuiInputBase-input': {
    cursor: 'pointer'
  }
}))

const ReferralButton = styled(Button)({
  width: '164px',
  height: '40px'
})

export {
  EnvelopeImage,
  EnvelopeImageContainer,
  EnvelopeShadow,
  HeroWrapper,
  HowItWorksButton,
  ReferralButton,
  ReferralContainer,
  ReferralInput,
  SectionContainer,
  Step,
  StepImage,
  StepNumber,
  StepText,
  StepTextContainer,
  StepsContainer,
  Subtitle,
  Title,
  TooltipLink
}
