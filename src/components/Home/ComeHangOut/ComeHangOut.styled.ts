import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const ComeHangOutContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  width: '100%',
  height: 800,
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
    bottom: -50,
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
  padding: theme.spacing(10, 8),
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    maxWidth: 393,
    padding: theme.spacing(6, 2),
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

const DownloadInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  justifyContent: 'center',
  position: 'relative',
  zIndex: 1
})

const DownloadCounts = styled('span')({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  color: '#fff',
  fontSize: 16
})

const DownloadSeparator = styled('span')({
  width: 1,
  height: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.3)'
})

const PlatformIcons = styled('span')(({ theme }) => ({
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& a': {
    display: 'flex',
    lineHeight: 0
  },
  [theme.breakpoints.down('sm')]: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& a': {
      pointerEvents: 'none',
      color: 'inherit',
      textDecoration: 'none'
    }
  }
}))

const PlatformIcon = styled('img')({
  width: 24,
  height: 24,
  filter: 'brightness(0) invert(1)'
})

const OsIcon = styled('img')({
  width: 32,
  height: 32,
  filter: 'brightness(0) invert(1)'
})

const ComingSoonRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 46
})

const ComingSoonIcon = styled('img')({
  width: 24,
  height: 32,
  filter: 'brightness(0) invert(1)'
})

const ComingSoonText = styled(Typography)({
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: 18,
  color: '#FCFCFC'
})

export {
  AvatarsImage,
  ComeHangOutContainer,
  ComingSoonIcon,
  ComingSoonRow,
  ComingSoonText,
  Content,
  DownloadCounts,
  DownloadInfo,
  DownloadSeparator,
  OsIcon,
  PlatformIcon,
  PlatformIcons,
  Title
}
export { HangOutButton } from '../shared/HangOutButton.styled'
export { GooglePlayButton, GooglePlayImage, MobileHeroSubtitle, SendLinkButton } from '../Hero/Hero.styled'
