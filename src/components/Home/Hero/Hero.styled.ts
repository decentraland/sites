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

const GradientBottom = styled(Box)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '100%',
  height: '50%',
  background: 'linear-gradient(0deg, #39055C 0%, rgba(0, 0, 0, 0) 100%)',
  zIndex: 1
})

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

export { GradientBottom, GradientTop, HeroBackground, HeroContainer, HeroContent, HeroTitle }
export { HangOutButton } from '../shared/HangOutButton.styled'
