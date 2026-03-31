import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const HeroContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  overflow: 'hidden',
  backgroundColor: '#39055C'
})

const HeroBackground = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& > video, & > img': {
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
  height: '50%',
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
  gap: theme.spacing(7.5),
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
  [theme.breakpoints.down('sm')]: {
    fontSize: 36
  }
}))

const HeroCTAWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(3),
  // Reserve space so the title doesn't shift when content loads async
  // Desktop: button (60) + gap (24) + info row (~28) = 112
  // Mobile: button (52) only
  minHeight: 112,
  justifyContent: 'flex-start',
  [theme.breakpoints.down('sm')]: {
    minHeight: 52
  }
}))

const AlreadyUserText = styled(Typography)({
  color: dclColors.neutral.white,
  fontSize: 16,
  lineHeight: 1.75,
  display: 'flex',
  alignItems: 'center',
  gap: 4
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
  lineHeight: 1.5,
  whiteSpace: 'nowrap'
})

const HeroPlatformSeparator = styled(Box)({
  width: 1,
  height: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.3)'
})

const HeroPlatformIcons = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1)
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

const MobileHeroSubtitle = styled(Typography)({
  color: dclColors.neutral.white,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
  fontSize: 20,
  lineHeight: '28px',
  textAlign: 'center',
  textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)'
})

const GooglePlayButton = styled('a')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'calc(100% - 32px)',
  maxWidth: 345,
  height: 64,
  borderRadius: 12,
  backgroundColor: '#FF2D55',
  textDecoration: 'none',
  cursor: 'pointer',
  boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    opacity: 0.9
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:active': {
    opacity: 0.8
  }
})

const GooglePlayImage = styled('img')({
  height: 40,
  width: 'auto'
})

const SendLinkButton = styled('button')({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: 'calc(100% - 32px)',
  maxWidth: 345,
  height: 46,
  borderRadius: 12,
  backgroundColor: '#FF2D55',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 700,
  fontSize: 16,
  color: '#FCFCFC',
  textTransform: 'uppercase',
  boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
  outline: 'none',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    opacity: 0.9
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:active': {
    opacity: 0.8
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:focus-visible': {
    outline: '2px solid #FCFCFC',
    outlineOffset: 2
  }
})

const ComingSoonRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 46
})

const AppleIcon = styled('img')({
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
  AlreadyUserDownloadLink,
  AlreadyUserText,
  AppleIcon,
  ComingSoonRow,
  ComingSoonText,
  GooglePlayButton,
  GooglePlayImage,
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
  MobileHeroContent,
  MobileHeroSubtitle,
  MobileHeroTitle,
  SendLinkButton
}
export { HangOutButton } from '../shared/HangOutButton.styled'
