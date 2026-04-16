import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const HeroContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  overflow: 'hidden',
  backgroundColor: '#39055C',
  [theme.breakpoints.down('sm')]: {
    minHeight: 'calc(var(--hero-vh, 1vh) * 100)'
  }
}))

const HeroBackground = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& > video, & > img, & > picture': {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& > picture > img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }
})

const GradientTop = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '24.3%',
  background: 'linear-gradient(180deg, #000000 0%, rgba(0, 0, 0, 0) 100%)',
  zIndex: 1
})

const GradientBottom = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '100%',
  height: '60%',
  background: 'linear-gradient(0deg, #39055C 0%, rgba(0, 0, 0, 0) 100%)',
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    height: '85%',
    background: 'linear-gradient(0deg, #39055C 0%, #39055C 30%, rgba(57, 5, 92, 0) 100%)'
  }
}))

const HeroContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(3),
  paddingBottom: theme.spacing(15),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(3),
    paddingBottom: theme.spacing(12),
    padding: `0 ${theme.spacing(3)} ${theme.spacing(12)}`
  }
}))

const HeroTitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontWeight: 600,
  lineHeight: 1.2,
  letterSpacing: -0.5,
  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
  marginBottom: theme.spacing(4.5),
  [theme.breakpoints.down('sm')]: {
    fontSize: 36,
    marginBottom: 0
  }
}))

const HeroCTAWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: theme.spacing(3),
  justifyContent: 'center',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center'
  }
}))

/* eslint-disable @typescript-eslint/naming-convention */
const DownloadButton = styled('a')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  width: 304,
  height: 64,
  backgroundColor: '#FF2D55',
  borderRadius: 16,
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '19.89px',
  color: '#FCFCFC',
  textTransform: 'uppercase',
  letterSpacing: '0.61px',
  boxSizing: 'border-box',
  outline: '3px solid transparent',
  outlineOffset: 4,
  transition: 'outline-color 0.15s ease',
  '&:hover': {
    outlineColor: 'white'
  },
  '& img': {
    width: 32,
    height: 32,
    display: 'block'
  }
})

const EpicButton = styled('a')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  width: 304,
  height: 64,
  backgroundColor: 'white',
  border: '3px solid white',
  borderRadius: 16,
  cursor: 'pointer',
  textDecoration: 'none',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 600,
  fontSize: '19.89px',
  color: '#242129',
  textTransform: 'uppercase',
  letterSpacing: '0.61px',
  boxSizing: 'border-box',
  outline: '3px solid transparent',
  outlineOffset: 4,
  transition: 'outline-color 0.15s ease',
  '&:hover': {
    outlineColor: 'white'
  },
  '& img': {
    width: 40,
    height: 40
  }
})
/* eslint-enable @typescript-eslint/naming-convention */

const AlreadyUserText = styled(Typography)({
  color: dclColors.neutral.white,
  fontSize: 16,
  lineHeight: 1.75,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
})

const AlreadyUserDownloadLink = styled('a')({
  color: '#FF2D55',
  textDecoration: 'none',
  textTransform: 'uppercase',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    opacity: 0.8
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& svg': {
    width: 24,
    height: 24
  }
})

const HeroDownloadInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  flexWrap: 'wrap',
  justifyContent: 'center'
}))

const HeroDownloadCounts = styled(Typography)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  color: dclColors.neutral.white,
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
  whiteSpace: 'nowrap',
  minWidth: 210
})

const HeroPlatformSeparator = styled(Box)({
  width: 1,
  height: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.3)'
})

const HeroPlatformIcons = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& a': {
    display: 'flex',
    lineHeight: 0
  }
}))

const HeroPlatformIcon = styled('img')({
  width: 24,
  height: 24,
  filter: 'brightness(0) invert(1)'
})

const HeroPlatformLabel = styled(Typography)({
  color: '#ECEBED',
  fontSize: 16,
  lineHeight: 1.5
})

const HeroOsIcon = styled('img')({
  width: 32,
  height: 32,
  filter: 'brightness(0) invert(1)'
})

const MobileHeroContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(3),
  paddingBottom: theme.spacing(8),
  padding: `0 ${theme.spacing(3)} ${theme.spacing(8)}`,
  width: '100%',
  maxWidth: 393
}))

const MobileHeroTitle = styled(Typography)({
  color: dclColors.neutral.white,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 700,
  fontSize: 40,
  lineHeight: 1.2,
  textAlign: 'center'
})

export {
  AlreadyUserDownloadLink,
  AlreadyUserText,
  GradientBottom,
  GradientTop,
  HeroBackground,
  HeroCTAWrapper,
  HeroContainer,
  HeroContent,
  HeroDownloadCounts,
  HeroDownloadInfo,
  HeroOsIcon,
  HeroPlatformIcon,
  HeroPlatformIcons,
  HeroPlatformLabel,
  HeroPlatformSeparator,
  HeroTitle,
  DownloadButton,
  EpicButton,
  MobileHeroContent,
  MobileHeroTitle
}
export { HangOutButton } from '../shared/HangOutButton.styled'
export {
  ComingSoonIcon as AppleIcon,
  ComingSoonRow,
  ComingSoonText,
  GooglePlayButton,
  GooglePlayImage,
  MobileSubtitle as MobileHeroSubtitle,
  SendLinkButton
} from '../shared/MobileCTA.styled'
