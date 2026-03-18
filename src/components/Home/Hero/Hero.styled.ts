import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const HeroContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  backgroundColor: dclColors.brand.purple
})

const HeroBackground = styled(Box)(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 0,
  ['& > video, & > img']: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  ['&::before']: {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '24.3%',
    background: 'linear-gradient(180deg, #000000 0%, rgba(0, 0, 0, 0) 100%)',
    zIndex: 1
  },
  ['&::after']: {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '64.2%',
    background: `linear-gradient(0deg, ${dclColors.brand.purple} 0%, rgba(0, 0, 0, 0) 100%)`,
    zIndex: 1
  }
}))

const HeroContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: `0 ${theme.spacing(3)}`,
  gap: theme.spacing(3)
}))

const HeroTitle = styled(Typography)({
  color: dclColors.neutral.white,
  fontWeight: 700,
  lineHeight: 1.1
})

const HeroSubtitle = styled(Typography)({
  color: dclColors.neutral.white,
  textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)'
})

const HeroOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: dclColors.blackTransparent.blurry,
  zIndex: 1
})

export { HeroBackground, HeroContainer, HeroContent, HeroOverlay, HeroSubtitle, HeroTitle }
