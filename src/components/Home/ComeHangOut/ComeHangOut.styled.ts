import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

const ComeHangOutContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  width: '100%',
  height: 840,
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    height: 600
  }
}))

const AvatarsImage = styled('img')(({ theme }) => ({
  position: 'absolute',
  top: 'calc(30% - 20px)',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  minWidth: 1920,
  maxWidth: 1920,
  pointerEvents: 'none',
  [theme.breakpoints.down('sm')]: {
    position: 'absolute',
    top: 'auto',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'auto',
    height: '65%',
    minWidth: 'auto',
    maxWidth: 'none'
  }
}))

const Content = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(7.5),
  paddingTop: theme.spacing(7.5),
  [theme.breakpoints.down('sm')]: {
    paddingTop: theme.spacing(6),
    gap: theme.spacing(3)
  }
}))

const Title = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontWeight: 600,
  textAlign: 'center',
  letterSpacing: -0.5,
  [theme.breakpoints.down('sm')]: {
    fontSize: 32
  }
}))

const HangOutButton = styled(Button)(({ theme }) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.MuiButton-root': {
    backgroundColor: '#FF2D55',
    color: '#FCFCFC',
    width: 270,
    height: 60,
    borderRadius: 16,
    padding: '20px 40px',
    gap: 24,
    fontSize: 19.89,
    fontWeight: 600,
    lineHeight: '31.82px',
    letterSpacing: 0.61,
    textTransform: 'uppercase',
    boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
    whiteSpace: 'nowrap',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&:hover': {
      backgroundColor: '#FF2D55'
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& .MuiButton-endIcon': {
      marginLeft: 0
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& .MuiSvgIcon-root': {
      fontSize: 32
    }
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&::before': {
    content: "''",
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    border: `4px solid ${dclColors.neutral.white}`,
    borderRadius: 14,
    opacity: 0,
    transition: theme.transitions.create(['top', 'right', 'bottom', 'left', 'opacity'], {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeInOut
    })
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover::before': {
    opacity: 1,
    top: -7.5,
    right: -7.5,
    bottom: -7.5,
    left: -7.5
  }
}))

export { AvatarsImage, ComeHangOutContainer, Content, HangOutButton, Title }
