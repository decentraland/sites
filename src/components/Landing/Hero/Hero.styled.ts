import { Box, Skeleton, Typography, styled } from 'decentraland-ui2'
import { Video } from '../../Video'
import type { VideoProps } from '../../Video/Video.types'

const HeroSection = styled('section')<{ hideNavbar?: boolean }>(({ hideNavbar, theme }) => {
  return {
    height: hideNavbar ? '100vh' : 'calc(100vh - 66px)',
    width: '100%',
    padding: 0,
    margin: 0,
    position: 'relative',
    minHeight: '600px',
    zIndex: 15,
    [theme.breakpoints.down('xs')]: {
      height: hideNavbar ? '100vh' : 'calc(100vh - 66px)',
      minHeight: hideNavbar ? '100vh' : 'calc(100vh - 66px)'
    }
  }
})

const HeroContainer = styled(Box)({
  height: '100%'
})

const HeroWrapper = styled(Box)(({ theme }) => {
  return {
    height: '100%',
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexFlow: 'column nowrap',
    justifyContent: 'center',
    paddingTop: '0',
    ['&::after']: {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      right: '20%',
      backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0))',
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
        backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))'
      }
    }
  }
})

const HeroContent = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1,
  ['&::after']: {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0))',
    zIndex: 2
  }
})

const HeroContentLoading = styled(Skeleton)({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
  transform: 'none',
  transformOrigin: 'none'
})

const HeroTextContainer = styled(Box)(({ theme }) => {
  return {
    maxWidth: '580px',
    zIndex: 3,
    marginLeft: theme.spacing(20),
    marginRight: theme.spacing(20),
    [theme.breakpoints.down('xl')]: {
      maxWidth: '525px',
      marginLeft: theme.spacing(10),
      marginRight: theme.spacing(10)
    },
    [theme.breakpoints.down('md')]: {
      marginLeft: 'auto',
      marginRight: 'auto',
      maxWidth: 'calc(100% - 108px)'
    },
    [theme.breakpoints.down('sm')]: {
      textAlign: 'center',
      maxWidth: 'calc(100% - 144px)'
    },
    [theme.breakpoints.down('xs')]: {
      textAlign: 'center',
      maxWidth: 'calc(100% - 32px)'
    }
  }
})

const HeroTitle = styled(Typography)(({ theme }) => {
  return {
    fontFamily: 'DecentralandHero',
    marginLeft: '-3px',
    textShadow: 'rgba(0, 0, 0, .25) 0px 2px 4px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '5rem',
      textShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px'
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: '4rem'
    }
  }
})

const HeroSubtitle = styled(Typography)(({ theme }) => {
  return {
    textShadow: 'rgba(0, 0, 0, .25) 0px 2px 4px',
    [theme.breakpoints.down('sm')]: {
      fontWeight: '500',
      textShadow: 'rgba(0, 0, 0, 1) 0px 2px 6px'
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: '1.4rem',
      lineHeight: '1.3'
    }
  }
})

const HeroActionsContainer = styled(Box)(({ theme }) => {
  return {
    marginTop: theme.spacing(4.25),
    width: '600px',
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(5),
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '36px',
      marginBottom: theme.spacing(2),
      width: '100%',
      ['& svg.MuiSvgIcon-root.MuiSvgIcon-fontSizeInherit']: {
        width: '36px',
        heigth: '36px'
      }
    }
  }
})

const HeroChevronContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4.25)
}))

const HeroImageContainer = styled(Box)<{ imageUrl?: string }>(({ imageUrl, theme }) => {
  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'right',
    [theme.breakpoints.down('xs')]: {
      backgroundPosition: 'top center'
    }
  }
})

const HeroVideo = styled(Video, {
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
    ['@media (max-aspect-ratio: 16 / 9)']: {
      width: '100%',
      height: '100%'
    },
    ['@media (min-aspect-ratio: 16 / 9)']: {
      width: '100%',
      height: '100%'
    }
  }
})

const HeroActionsWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  width: '100%',
  [theme.breakpoints.down('sm')]: {
    alignItems: 'center'
  }
}))

const HeroButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: 'fit-content',
  [theme.breakpoints.down('sm')]: {
    width: '100%'
  }
}))

const HeroAlreadyUserContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  width: '100%',
  alignItems: 'center',
  marginTop: theme.spacing(4),
  fontSize: theme.typography.pxToRem(20)
}))

const HeroAlreadyUserLink = styled('a')(({ theme }) => ({
  textDecoration: 'underline',
  textDecorationStyle: 'solid',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  cursor: 'pointer',
  textTransform: 'uppercase',
  marginLeft: theme.spacing(1),
  fontWeight: 700
}))

export {
  HeroActionsContainer,
  HeroActionsWrapper,
  HeroAlreadyUserContainer,
  HeroAlreadyUserLink,
  HeroButtonContainer,
  HeroChevronContainer,
  HeroContainer,
  HeroContent,
  HeroContentLoading,
  HeroImageContainer,
  HeroSection,
  HeroSubtitle,
  HeroTextContainer,
  HeroTitle,
  HeroVideo,
  HeroWrapper
}
