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
    boxShadow: 'rgba(0, 0, 0, 0.4) 0px 2px 8px',
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

export { GradientBottom, GradientTop, HangOutButton, HeroBackground, HeroContainer, HeroContent, HeroTitle }
