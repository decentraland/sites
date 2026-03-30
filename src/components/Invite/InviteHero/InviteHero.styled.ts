import { Box, Typography, styled } from 'decentraland-ui2'
import { Video } from '../../Video'

const HeroSection = styled('section')(({ theme }) => ({
  height: 'content',
  minHeight: '100vh',
  width: '100%',
  padding: 0,
  margin: 0,
  position: 'relative',
  zIndex: theme.zIndex.appBar - 1,
  marginTop: 0,
  [theme.breakpoints.down('sm')]: {
    height: 'content',
    minHeight: '100vh'
  }
}))

const HeroContainer = styled(Box)(({ theme }) => ({
  height: 'content',
  minHeight: '100vh',
  width: '100%',
  position: 'relative',
  display: 'flex',
  flexFlow: 'column nowrap',
  justifyContent: 'center',
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(12),
  alignItems: 'flex-start',
  [theme.breakpoints.down('xs')]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  }
}))

const HeroContent = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1,
  overflow: 'hidden'
})

const HeroTextContainer = styled(Box)(({ theme }) => ({
  maxWidth: '40vw',
  zIndex: 2,
  marginLeft: theme.spacing(25),
  marginRight: 0,
  textAlign: 'left',
  transition: theme.transitions.create(['opacity', 'padding-top'], {
    duration: theme.transitions.duration.complex,
    easing: theme.transitions.easing.easeInOut
  }),
  [theme.breakpoints.down('md')]: {
    marginLeft: theme.spacing(24),
    marginRight: theme.spacing(24)
  },
  [theme.breakpoints.down('sm')]: {
    marginLeft: theme.spacing(18.5),
    marginRight: theme.spacing(18.5),
    maxWidth: 'none',
    width: `calc(100% - ${theme.spacing(37)})`,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '50%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '50%'
  },
  [theme.breakpoints.down('xs')]: {
    marginLeft: theme.spacing(6),
    marginRight: theme.spacing(6),
    width: `calc(100% - ${theme.spacing(12)})`
  },
  [theme.breakpoints.down(390)]: {
    height: '70%',
    top: '30%'
  }
}))

const HeroTextWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(15)
}))

const EnvelopeImageContainer = styled(Box)(({ theme }) => ({
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  zIndex: 11,
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-100%, -50%)',
    zIndex: 11,
    marginBottom: 0
  }
}))

const EnvelopeShadow = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  borderRadius: '50%',
  width: '100px',
  height: '100px',
  zIndex: 0,
  background: 'radial-gradient(circle, rgba(255,180,216,1) 0%, rgba(255,0,200,1) 50%, rgba(145,0,255,1) 80%, transparent 100%)',
  filter: 'blur(40px)',
  [theme.breakpoints.down('sm')]: {
    width: '150px',
    height: '150px'
  },
  [theme.breakpoints.down(390)]: {
    width: '100px',
    height: '100px'
  }
}))

const EnvelopeImage = styled('img')(({ theme }) => ({
  width: '115px',
  height: '115px',
  objectFit: 'contain',
  position: 'relative',
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    width: '160px',
    height: '160px'
  },
  [theme.breakpoints.down(390)]: {
    width: '80px',
    height: '80px'
  }
}))

const HeroTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '60px',
  lineHeight: '120%',
  letterSpacing: '-0.5px',
  marginBottom: theme.spacing(6),
  [theme.breakpoints.down('lg')]: {
    fontSize: '48px'
  },
  [theme.breakpoints.down('xs')]: {
    fontSize: '32px'
  }
}))

const HeroSubTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '32px',
  lineHeight: '124%',
  letterSpacing: '0px',
  [theme.breakpoints.down('sm')]: {
    fontSize: '24px'
  },
  [theme.breakpoints.down('xs')]: {
    fontSize: '20px'
  }
}))

/* eslint-disable @typescript-eslint/naming-convention */
const GradientText = styled('span')({
  background: 'linear-gradient(261.51deg, #FF2D55 6.92%, #FFBC5B 83.3%)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent'
})
/* eslint-enable @typescript-eslint/naming-convention */

const HeroActionsContainer = styled(Box)({})

const HeroOverlayVideo = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  width: '60vw',
  background: 'linear-gradient(180deg, #410461 0%, #5D0089 100%)',
  zIndex: 3,
  clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
  [theme.breakpoints.down('sm')]: {
    width: '100vw',
    top: '50%',
    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
  }
}))

const HeroVideo = styled(Video)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: '50%',
  zIndex: 2,
  objectFit: 'cover',
  objectPosition: 'center',
  width: '100%',
  height: '100%',
  [theme.breakpoints.down('sm')]: {
    left: 0,
    bottom: '50%'
  }
}))

const AvatarContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  backgroundColor: 'transparent',
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: '50%',
  zIndex: 2,
  [theme.breakpoints.down('sm')]: {
    height: '50%',
    top: 0,
    left: 0,
    bottom: '50%',
    width: '100%'
  },
  [theme.breakpoints.down(390)]: {
    height: '30%'
  }
}))

const AvatarWrapper = styled(Box)(({ theme }) => ({
  height: '100%',
  [theme.breakpoints.down('sm')]: {
    marginLeft: theme.spacing(17.5)
  }
}))

export {
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
}
