import { Box, Typography, dclColors, styled } from 'decentraland-ui2'
import { Video } from '../../Video'
import type { VideoProps } from '../../Video/Video.types'

const CreatorsHeroSection = styled('section')(({ theme }) => ({
  height: 'calc(100vh - 66px)',
  width: '100%',
  padding: 0,
  margin: 0,
  position: 'relative',
  minHeight: '600px',
  zIndex: 15,
  [theme.breakpoints.down('xs')]: {
    height: 'calc(100vh - 66px)',
    minHeight: 'calc(100vh - 66px)'
  }
}))

const CreatorsHeroWrapper = styled(Box)(({ theme }) => ({
  height: '100%',
  width: '100%',
  position: 'relative',
  display: 'flex',
  flexFlow: 'column nowrap',
  justifyContent: 'center',
  alignItems: 'center',
  ['&::after']: {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundImage:
      'linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 40%, rgba(0, 0, 0, 0.5) 60%, rgba(0, 0, 0, 0.3) 100%)',
    zIndex: 1
  },
  [theme.breakpoints.down('sm')]: {
    justifyContent: 'flex-end',
    ['&::after']: {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      right: 0,
      backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4))'
    }
  }
}))

const CreatorsHeroContent = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 0
})

const CreatorsHeroTextContainer = styled(Box)(({ theme }) => ({
  maxWidth: '800px',
  position: 'relative',
  zIndex: 3,
  textAlign: 'center',
  marginLeft: 'auto',
  marginRight: 'auto',
  padding: theme.spacing(0, 4),
  [theme.breakpoints.down('md')]: {
    maxWidth: 'calc(100% - 108px)'
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: 'calc(100% - 64px)'
  },
  [theme.breakpoints.down('xs')]: {
    maxWidth: 'calc(100% - 32px)'
  }
}))

const CreatorsHeroTitle = styled(Typography)(({ theme }) => ({
  fontFamily: 'DecentralandHero',
  fontSize: '64px',
  fontWeight: 700,
  marginLeft: '-3px',
  textShadow: 'rgba(0, 0, 0, .25) 0px 2px 4px',
  ['& span']: {
    background: `linear-gradient(244deg, ${dclColors.brand.ruby} -11.67%, ${dclColors.brand.yellow} 88.23%)`,
    backgroundClip: 'text',
    ['WebkitBackgroundClip']: 'text',
    ['WebkitTextFillColor']: 'transparent'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '48px',
    textShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px'
  },
  [theme.breakpoints.down('xs')]: {
    fontSize: '36px'
  }
}))

const CreatorsHeroSubtitle = styled(Typography)(({ theme }) => ({
  textShadow: 'rgba(0, 0, 0, .25) 0px 2px 4px',
  ['&&']: {
    fontSize: '18px',
    lineHeight: '1.5'
  },
  [theme.breakpoints.down('sm')]: {
    fontWeight: '500',
    textShadow: 'rgba(0, 0, 0, 1) 0px 2px 6px',
    ['&&']: {
      fontSize: '15px'
    }
  },
  [theme.breakpoints.down('xs')]: {
    ['&&']: {
      fontSize: '1rem',
      lineHeight: '1.4'
    }
  }
}))

const CreatorsHeroActionsContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4.25),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(2)
  }
}))

const CreatorsHeroImageContainer = styled(Box)<{ imageUrl?: string }>(({ imageUrl }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1,
  backgroundImage: `url(${imageUrl})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
}))

const CreatorsHeroVideo = styled(Video, {
  shouldForwardProp: prop => prop !== 'isInView'
})((props: VideoProps & { isInView: boolean }) => {
  const { isInView } = props
  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    opacity: isInView ? 1 : 0,
    objectFit: 'cover',
    objectPosition: 'center',
    transition: 'opacity .5s',
    width: '100%',
    height: '100%'
  }
})

export {
  CreatorsHeroActionsContainer,
  CreatorsHeroContent,
  CreatorsHeroImageContainer,
  CreatorsHeroSection,
  CreatorsHeroSubtitle,
  CreatorsHeroTextContainer,
  CreatorsHeroTitle,
  CreatorsHeroVideo,
  CreatorsHeroWrapper
}
