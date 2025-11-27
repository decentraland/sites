import { Box, Typography, styled } from 'decentraland-ui2'
import { MissionType } from './Missions.types'

const MissionDetailContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isInView'
})<{ isInView: boolean }>((props) => {
  const { isInView } = props
  return {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    zIndex: isInView ? 4 : 0
  }
})

const MissionDetailWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isInView' && prop !== 'missionId'
})<{ isInView: boolean; missionId: MissionType }>((props) => {
  const { isInView, missionId, theme } = props

  let radianColor = 'radial-gradient(50% 61.46% at 0% 49.93%, rgba(211, 78, 222, 0.3) 0%, rgba(211, 78, 222, 0) 75%)'
  let mobileRadianColor = 'radial-gradient(70.46% 45.24% at 51.99% 100.83%, rgba(211, 78, 222, 0.3) 0%, rgba(211, 78, 222, 0) 89.85%)'
  if (missionId === MissionType.CREATE) {
    radianColor = 'radial-gradient(50% 61.46% at 0% 49.93%, rgba(0, 247, 0, 0.2) 0%, rgba(0, 247, 0, 0) 75%)'
    mobileRadianColor = 'radial-gradient(71.73% 50.83% at 51.99% 100.83%, rgba(0, 247, 0, 0.3) 0%, rgba(0, 247, 0, 0) 75%);'
  } else if (missionId === MissionType.INFLUENCE) {
    radianColor = 'radial-gradient(50% 61.46% at 0% 49.93%, rgba(255, 209, 70, 0.26) 0%, rgba(255, 209, 70, 0) 75%)'
    mobileRadianColor = 'radial-gradient(71.73% 50.83% at 51.99% 100.83%, rgba(255, 209, 70, 0.3) 0%, rgba(255, 209, 70, 0) 75%)'
  }

  return {
    position: 'sticky',
    paddingLeft: theme.spacing(20),
    paddingRight: '60vw',
    paddingTop: '30vh',
    top: 0,
    zIndex: isInView ? 2 : 0,
    opacity: isInView ? 1 : 0,
    background: isInView ? radianColor : 'transparent',
    height: '100vh',
    transition: `${theme.transitions.create(['opacity', 'background'], {
      duration: theme.transitions.duration.enteringScreen,
      easing: theme.transitions.easing.easeInOut
    })}`,
    [theme.breakpoints.down('xl')]: {
      paddingLeft: theme.spacing(10)
    },
    [theme.breakpoints.down('md')]: {
      paddingLeft: theme.spacing(6.75)
    },
    [theme.breakpoints.down('sm')]: {
      paddingLeft: theme.spacing(8),
      paddingRight: theme.spacing(8),
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: isInView ? '44vh' : '100vh',
      paddingBottom: isInView ? theme.spacing(7) : `-48vh`,
      right: 0,
      left: 0,
      zIndex: 2,
      opacity: isInView ? 1 : 0,
      justifyContent: 'space-between',
      background: mobileRadianColor,
      width: '100vw',
      height: '100vh'
    },
    [theme.breakpoints.down('xs')]: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2)
    }
  }
})

const MissionTextContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isInView'
})<{ isInView: boolean }>((props) => {
  const { isInView, theme } = props

  return {
    marginLeft: isInView ? 0 : '-100vw',
    marginRight: isInView ? 0 : '100vw',
    transition: `${theme.transitions.create(['all'], {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeInOut
    })}`,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0,
      marginBottom: isInView ? 0 : '-100vh',
      marginTop: isInView ? 0 : '100vh'
    }
  }
})

const MissionActionsContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isInView'
})<{ isInView: boolean }>((props) => {
  const { isInView, theme } = props

  return {
    marginTop: theme.spacing(4),
    marginLeft: isInView ? 0 : '-100vw',
    marginRight: isInView ? 0 : '100vw',
    transition: `${theme.transitions.create(['all'], {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeInOut
    })}`,
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: theme.spacing(17.5),
      justifyContent: 'space-between',
      marginLeft: 0,
      marginRight: 0,
      marginBottom: isInView ? 0 : '-100vh',
      marginTop: isInView ? 0 : '100vh'
    }
  }
})

const MissionButtonBottom = styled(Box)({
  fontSize: '36px'
})

const MissionTitle = styled(Typography)(({ theme }) => {
  return {
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      textAlign: 'center',
      flexDirection: 'column',
      marginBottom: theme.spacing(2),
      fontSize: '40px'
    }
  }
})

const MissionDescription = styled(Typography)(({ theme }) => {
  return {
    [theme.breakpoints.down('sm')]: {
      fontSize: '18px'
    }
  }
})

const MissionJumpInWrapper = styled(Box)({
  '& .MuiButton-sizeSmall.MuiButton-containedPrimary:not(.Mui-disabled):not(.Mui-focusVisible)': {
    height: '63px',
    width: '246px',
    ['& span']: {
      fontSize: '16px'
    }
  }
})

export {
  MissionDetailContainer,
  MissionDetailWrapper,
  MissionTextContainer,
  MissionActionsContainer,
  MissionButtonBottom,
  MissionTitle,
  MissionDescription,
  MissionJumpInWrapper
}
