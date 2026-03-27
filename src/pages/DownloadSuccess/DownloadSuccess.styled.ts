import { Box, Card, CardContent, CardMedia, LinearProgress, Typography, dclColors, keyframes, styled } from 'decentraland-ui2'

const DownloadSuccessPageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  background: '#830e5b',
  backgroundImage: `linear-gradient(99.92deg, ${dclColors.brand.lavender} -16.74%, #481A5F 28.57%, #33144C 56.18%, #501C66 76.26%, ${dclColors.brand.lavender} 100%)`,
  flex: 1,
  minHeight: '900px',
  alignItems: 'center',
  justifyContent: 'center',
  [theme.breakpoints.down('sm')]: {
    minHeight: 'auto',
    padding: theme.spacing(4, 0)
  }
}))

const DownloadSuccessHeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'center',
  position: 'relative',
  textAlign: 'center',
  padding: theme.spacing(0, 2)
}))

const DownloadSuccessOsIcon = styled('img')(({ theme }) => ({
  width: theme.spacing(10),
  height: theme.spacing(10),
  filter: 'brightness(0) invert(1)'
}))

const DownloadSuccessTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(4)
}))

const DownloadSuccessSubtitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  ['& span']: {
    color: theme.palette.primary.main
  }
}))

const DownloadSuccessCardWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  margin: theme.spacing(10),
  flexWrap: 'nowrap',
  justifyContent: 'center',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'center',
    margin: theme.spacing(6, 4)
  }
}))

const DownloadSuccessCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  maxWidth: '350px',
  flex: 1,
  height: '420px',
  borderRadius: theme.spacing(6),
  border: '1px solid #A09BA87A',
  backgroundColor: '#1c072fe6',
  marginRight: theme.spacing(4),
  marginBottom: theme.spacing(4),
  ['&:last-child']: {
    marginRight: 0
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: '100%',
    width: '100%',
    marginRight: 0,
    height: 'auto'
  }
}))

const DownloadSuccessCardMedia = styled(CardMedia)(({ theme }) => ({
  height: '240px',
  backgroundColor: '#5122545e',
  [theme.breakpoints.down('md')]: {
    minHeight: '200px'
  }
}))

const highlightFadeIn = keyframes`
  0% { box-shadow: 0 0 0 0 ${dclColors.brand.lavender}; }
  50% { box-shadow: 0 0 25px 18.5px ${dclColors.brand.lavender}; }
  100% { box-shadow: 0 0 0 0 ${dclColors.brand.lavender}; }
`

const HighlightAnimation = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '272px',
  right: '86px',
  width: '25.6px',
  height: '25.6px',
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: 1,
  backgroundColor: 'transparent',
  animation: `${highlightFadeIn} 1s ease-in-out infinite`,
  [theme.breakpoints.down('lg')]: {
    display: 'none'
  }
}))

const DownloadSuccessCardContent = styled(CardContent)({})

const DownloadSuccessCardTitle = styled(Typography)({})

const DownloadSuccessCardSubtitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  fontWeight: 700,
  color: '#CFCDD4',
  ['& span']: {
    color: theme.palette.common.white
  }
}))

const DownloadSuccessFooterContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(0, 2),
  ['& a']: {
    color: theme.palette.primary.main,
    textDecoration: 'underline',
    ['&:hover']: {
      color: theme.palette.primary.light
    }
  }
}))

const DownloadBackdrop = styled(Box)<{ open: boolean }>(({ theme, open }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: theme.zIndex.drawer + 1,
  display: open ? 'flex' : 'none',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(3),
  backgroundColor: 'rgba(26, 9, 28, 0.2)',
  backdropFilter: 'blur(8px)',
  ['WebkitBackdropFilter' as string]: 'blur(8px)',
  color: theme.palette.common.white
}))

const DownloadBackdropContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: 493,
  height: 251,
  borderRadius: theme.spacing(4),
  padding: theme.spacing(6),
  gap: theme.spacing(4),
  backgroundColor: dclColors.brand.purple,
  [theme.breakpoints.down('sm')]: {
    width: 'calc(100% - 32px)',
    height: 'auto',
    padding: theme.spacing(4)
  }
}))

const DownloadBackdropText = styled(Typography)(({ theme }) => ({
  ...theme.typography.h6,
  textAlign: 'center'
}))

const DownloadDetailContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
  width: '100%'
}))

const DownloadProgressContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(2),
  width: '100%'
}))

const DownloadProgressBar = styled(LinearProgress)(({ theme }) => ({
  flex: 1,
  height: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  ['& .MuiLinearProgress-bar']: {
    background: 'linear-gradient(90deg, #FF2D55 0%, #FFBC5B 100%)',
    borderRadius: theme.spacing(1)
  }
}))

export {
  DownloadBackdrop,
  DownloadBackdropContent,
  DownloadBackdropText,
  DownloadDetailContainer,
  DownloadProgressBar,
  DownloadProgressContainer,
  DownloadSuccessCard,
  DownloadSuccessCardContent,
  DownloadSuccessCardMedia,
  DownloadSuccessCardSubtitle,
  DownloadSuccessCardTitle,
  DownloadSuccessCardWrapper,
  DownloadSuccessFooterContainer,
  DownloadSuccessHeaderContainer,
  DownloadSuccessOsIcon,
  DownloadSuccessPageContainer,
  DownloadSuccessSubtitle,
  DownloadSuccessTitle,
  HighlightAnimation
}
