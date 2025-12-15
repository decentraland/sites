import { Box, Typography, styled, useTheme } from 'decentraland-ui2'
import { Video } from '../../Video'
import type { VideoProps } from '../../Video/Video.types'

const BannerCTASection = styled('section')(() => {
  const theme = useTheme()
  return {
    height: '80vh',
    width: '100%',
    padding: 0,
    margin: 0,
    position: 'relative',
    minHeight: '584px',
    zIndex: 20,
    [theme.breakpoints.down('xs')]: {
      height: '100vh',
      minHeight: '100vh'
    }
  }
})

const BannerCTAContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'isCentered'
})((props: { isCentered: boolean }) => {
  const { isCentered } = props
  const theme = useTheme()
  return {
    height: '100%',
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexFlow: 'column nowrap',
    justifyContent: 'center',
    paddingTop: '0',
    alignItems: isCentered ? 'center' : 'flex-start',
    ['&::after']: {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: '-1px',
      right: isCentered ? 0 : '50%',
      backgroundImage: isCentered
        ? 'radial-gradient(#161518a8, #161518a8)'
        : 'linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0))',
      zIndex: 1
    },
    [theme.breakpoints.down('sm')]: {
      justifyContent: isCentered ? 'center' : 'flex-end',
      ['&::after']: {
        left: 0,
        top: isCentered ? 0 : '50%',
        bottom: 0,
        right: 0,
        backgroundImage: isCentered
          ? 'radial-gradient(#161518a8, #161518a8)'
          : 'linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0))'
      }
    },
    [theme.breakpoints.down('xs')]: {
      paddingBottom: theme.spacing(8.75),
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1)
    }
  }
})

const BannerCTAContent = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 1
})

const BannerCTATextContainer = styled(Box, {
  shouldForwardProp: prop => prop !== 'isCentered' && prop !== 'isInView'
})((props: { isCentered: boolean; isInView: boolean }) => {
  const { isCentered, isInView } = props
  const theme = useTheme()

  return {
    maxWidth: isCentered ? '830px' : '610px',
    zIndex: 2,
    marginLeft: isCentered ? 0 : theme.spacing(20),
    marginRight: isCentered ? 0 : theme.spacing(20),
    textAlign: isCentered ? 'center' : 'left',
    opacity: isInView ? 1 : 0,
    transition: theme.transitions.create(['opacity', 'padding-top'], {
      duration: theme.transitions.duration.complex,
      easing: theme.transitions.easing.easeInOut
    }),
    [theme.breakpoints.down('xl')]: {
      marginLeft: theme.spacing(10),
      marginRight: theme.spacing(10)
    },
    [theme.breakpoints.down('sm')]: {
      textAlign: 'center',
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      width: 'calc(100% - 16px)',
      maxWidth: 'none',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      paddingTop: isInView ? 0 : theme.spacing(62.5),
      marginTop: isCentered ? 0 : '25vh',
      paddingBottom: theme.spacing(7)
    },
    [theme.breakpoints.down('xs')]: {
      height: isCentered ? 'auto' : '100%',
      marginTop: isCentered ? 0 : '13vh',
      paddingBottom: isCentered ? 0 : theme.spacing(7)
    }
  }
})

const BannerCTATextWrapper = styled(Box)(() => {
  const theme = useTheme()
  return {
    [theme.breakpoints.down('sm')]: {
      marginLeft: theme.spacing(3),
      marginRight: theme.spacing(3)
    }
  }
})

const BannerCTATitle = styled(Typography, {
  shouldForwardProp: prop => prop !== 'isPositionFirst'
})((props: { isPositionFirst?: boolean }) => {
  const { isPositionFirst } = props
  const theme = useTheme()
  if (!isPositionFirst) {
    return {
      fontWeight: 600,
      fontFeatureSettings: "'liga' off, 'clig' off",
      textShadow: 'rgba(0, 0, 0, .25) 0px 2px 4px',
      marginBottom: theme.spacing(3),
      [theme.breakpoints.down('sm')]: {
        textShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
        fontSize: '6rem'
      },
      [theme.breakpoints.down('xs')]: {
        fontSize: '4rem'
      }
    }
  }
  return {
    marginBottom: theme.spacing(3),
    fontWeight: 700,
    textShadow: 'rgba(0, 0, 0, .25) 0px 2px 4px',
    [theme.breakpoints.down('sm')]: {
      textShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
      marginBottom: theme.spacing(1)
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: '2.8rem'
    },
    [theme.breakpoints.up('xl')]: {
      fontSize: '5rem'
    }
  }
})

const BannerCTASubTitle = styled(Typography, {
  shouldForwardProp: prop => prop !== 'isPositionFirst'
})((props: { isPositionFirst: boolean }) => {
  const { isPositionFirst } = props
  const theme = useTheme()
  if (isPositionFirst) {
    return {
      fontStyle: 'italic',
      fontWeight: 600,
      textShadow: 'rgba(0, 0, 0, .25) 0px 2px 4px',
      [theme.breakpoints.down('sm')]: {
        textShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
        fontSize: '3rem'
      },
      [theme.breakpoints.down('xs')]: {
        fontSize: '1.5rem'
      }
    }
  }
  return {
    textShadow: 'rgba(0, 0, 0, .25) 0px 2px 4px',
    [theme.breakpoints.down('sm')]: {
      textShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
      fontSize: '2rem'
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: '1.7rem'
    }
  }
})

const BannerCTAActionsContainer = styled(Box)(() => {
  return {
    marginTop: '34px'
  }
})

const BannerCTAImageContainer = styled('div')<{ imageUrl?: string }>(({ imageUrl }) => {
  const theme = useTheme()
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

const BannerCTAVideo = styled(Video, {
  shouldForwardProp: prop => prop !== 'isInView'
})((props: VideoProps & { isInView: boolean }) => {
  const { isInView } = props
  const theme = useTheme()
  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
    width: '100%',
    height: '100%',
    opacity: isInView ? 1 : 0,
    objectFit: 'cover',
    objectPosition: 'right',
    transition: 'opacity .5s',
    ['&::-webkit-media-controls-fullscreen-button']: {
      display: 'none !important'
    },
    ['&::-webkit-media-controls']: {
      display: 'none !important'
    },
    pointerEvents: 'none',
    userSelect: 'none',
    touchAction: 'none',
    [theme.breakpoints.down('sm')]: {
      objectPosition: 'bottom center'
    }
  }
})

const BannerCTAJumpInWrapper = styled(Box)({
  ['& .MuiButton-sizeSmall.MuiButton-containedPrimary:not(.Mui-disabled):not(.Mui-focusVisible)']: {
    height: '63px',
    width: '246px',
    ['& span']: {
      fontSize: '16px'
    }
  }
})

export {
  BannerCTASection,
  BannerCTAContainer,
  BannerCTAContent,
  BannerCTATextContainer,
  BannerCTATextWrapper,
  BannerCTATitle,
  BannerCTASubTitle,
  BannerCTAActionsContainer,
  BannerCTAImageContainer,
  BannerCTAVideo,
  BannerCTAJumpInWrapper
}
