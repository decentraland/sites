import { Box, Typography, styled } from 'decentraland-ui2'

const HeroSection = styled('section')({
  height: 'calc(90vh - 96px)',
  width: '100%',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 92,
  overflow: 'hidden'
})

const HeroBackground = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  ['& video, & .hero-bg-image']: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center'
  }
})

const HeroContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  maxWidth: 739,
  padding: `0 ${theme.spacing(4)}`,
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%'
  }
}))

const HeroTitle = styled(Typography)(({ theme }) => ({
  fontSize: 64,
  fontWeight: 700,
  letterSpacing: '-1.28px',
  lineHeight: 'normal',
  marginBottom: theme.spacing(5.5),
  color: '#fff',
  ['& span']: {
    background: 'linear-gradient(287deg, #ff2d55 5.21%, #ffbc5b 56.5%)',
    backgroundClip: 'text',
    ['WebkitBackgroundClip' as string]: 'text',
    ['WebkitTextFillColor' as string]: 'transparent'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: 48,
    letterSpacing: '-0.8px',
    marginBottom: theme.spacing(4)
  }
}))

const HeroSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: 24,
  fontWeight: 500,
  lineHeight: '32px',
  marginBottom: theme.spacing(8.5),
  color: '#fff',
  [theme.breakpoints.down('sm')]: {
    fontSize: 20,
    lineHeight: '30px',
    fontWeight: 400,
    marginBottom: theme.spacing(8)
  }
}))

const HeroActions = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
})

const ChevronContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 40,
  paddingBottom: 32,
  ['&:hover svg']: {
    animation: 'moveUpDown 1s linear infinite'
  },
  ['@keyframes moveUpDown']: {
    ['0%']: { transform: 'translateY(0)' },
    ['50%']: { transform: 'translateY(-10px)' },
    ['100%']: { transform: 'translateY(0)' }
  }
})

export { ChevronContainer, HeroActions, HeroBackground, HeroContent, HeroSection, HeroSubtitle, HeroTitle }
