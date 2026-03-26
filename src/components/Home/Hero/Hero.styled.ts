import { Box, Button, Typography, dclColors, styled } from 'decentraland-ui2'

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
    gap: theme.spacing(4),
    paddingBottom: theme.spacing(8),
    padding: `0 ${theme.spacing(3)} ${theme.spacing(8)}`
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
    whiteSpace: 'nowrap',
    boxShadow: 'none',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&:hover': {
      backgroundColor: '#E0264B',
      boxShadow: 'none'
    },
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& .MuiButton-endIcon': {
      marginLeft: 0
    }
  },
  [theme.breakpoints.down('sm')]: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&.MuiButton-root': {
      width: 240,
      height: 52,
      fontSize: 16,
      padding: '16px 32px'
    }
  }
}))

const JumpInIconWrapper = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 8,
  border: '2.5px solid rgba(252, 252, 252, 0.5)',
  backgroundColor: '#FF2D55'
})

export { GradientBottom, GradientTop, HangOutButton, HeroBackground, HeroContainer, HeroContent, HeroTitle, JumpInIconWrapper }
