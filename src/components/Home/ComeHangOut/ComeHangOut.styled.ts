import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const ComeHangOutContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  width: '100%',
  height: 600,
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    height: 480
  }
}))

const AvatarsImage = styled('img')(({ theme }) => ({
  position: 'absolute',
  top: 'calc(35% - 20px)',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'auto',
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
  gap: theme.spacing(3),
  paddingTop: theme.spacing(5),
  [theme.breakpoints.down('sm')]: {
    paddingTop: theme.spacing(4),
    gap: theme.spacing(2)
  }
}))

const Title = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontWeight: 600,
  fontSize: 48,
  textAlign: 'center',
  letterSpacing: -0.5,
  [theme.breakpoints.down('sm')]: {
    fontSize: 32
  }
}))

export { AvatarsImage, ComeHangOutContainer, Content, Title }
export { HangOutButton } from '../shared/HangOutButton.styled'
