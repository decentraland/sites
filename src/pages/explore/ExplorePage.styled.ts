import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

// MUI AppBar default height: 64px desktop / 56px mobile
const NAVBAR_HEIGHT_DESKTOP = 64
const NAVBAR_HEIGHT_MOBILE = 56

// How many pixels the parallax section "slides under" the neighboring sections,
// producing the depth / pass-behind illusion.
const DEPTH_OVERLAP = 48

// ─── Section 1: Hero Carousel ────────────────────────────────────────────────

const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: `calc(100vh - ${NAVBAR_HEIGHT_DESKTOP}px)`,
  overflow: 'hidden',
  zIndex: 2,
  [theme.breakpoints.down('sm')]: {
    height: `calc(100vh - ${NAVBAR_HEIGHT_MOBILE}px)`
  },
  /* eslint-disable @typescript-eslint/naming-convention */
  '& .swiper': {
    width: '100%',
    height: '100%'
  },
  '& .swiper-slide': {
    width: '100%',
    height: '100%'
  },
  '& .swiper-button-prev, & .swiper-button-next': {
    color: dclColors.neutral.white,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: '50%',
    backdropFilter: 'blur(4px)',
    transition: 'background-color 0.2s ease',
    '&::after': {
      fontSize: 16,
      fontWeight: 700
    },
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.65)'
    },
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  '& .swiper-pagination': {
    bottom: '24px !important'
  },
  '& .swiper-pagination-bullet': {
    backgroundColor: 'rgba(255,255,255,0.45)',
    opacity: 1,
    width: 8,
    height: 8,
    transition: 'all 0.3s ease'
  },
  '& .swiper-pagination-bullet-active': {
    backgroundColor: dclColors.neutral.white,
    width: 28,
    borderRadius: 4
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}))

const HeroSlide = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden'
})

const HeroSlideImage = styled('img')({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  userSelect: 'none',
  pointerEvents: 'none'
})

const HeroSlideOverlay = styled(Box)({
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.12) 100%)',
  zIndex: 1
})

const HeroSlideContent = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: theme.spacing(10),
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: theme.spacing(2.5),
  padding: `0 ${theme.spacing(3)}`,
  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(8),
    gap: theme.spacing(1.5)
  }
}))

const HeroSlideTitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontWeight: 700,
  textShadow: '0 2px 12px rgba(0,0,0,0.45)',
  lineHeight: 1.15,
  letterSpacing: -0.5,
  [theme.breakpoints.down('sm')]: {
    fontSize: 32
  }
}))

const HeroSlideSubtitle = styled(Typography)(({ theme }) => ({
  color: 'rgba(255,255,255,0.82)',
  fontWeight: 400,
  textShadow: '0 1px 6px rgba(0,0,0,0.4)',
  [theme.breakpoints.down('sm')]: {
    fontSize: 16
  }
}))

// ─── Section 2: Parallax Floating Images ─────────────────────────────────────

const ParallaxSection = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '300vh',
  backgroundColor: '#39055C',
  // Overlap neighboring sections to create depth / pass-behind illusion
  marginTop: -DEPTH_OVERLAP,
  marginBottom: -DEPTH_OVERLAP,
  zIndex: 1
})

const ParallaxSticky = styled(Box)({
  position: 'sticky',
  top: 0,
  width: '100%',
  height: '100vh',
  overflow: 'hidden',
  /* eslint-disable @typescript-eslint/naming-convention */
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    background: 'linear-gradient(to bottom, #39055C 0%, transparent 100%)',
    zIndex: 10,
    pointerEvents: 'none'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    background: 'linear-gradient(to top, #39055C 0%, transparent 100%)',
    zIndex: 10,
    pointerEvents: 'none'
  }
  /* eslint-enable @typescript-eslint/naming-convention */
})

interface ParallaxImageWrapperProps {
  $position: 'left' | 'right'
}

const ParallaxImageWrapper = styled(Box, {
  shouldForwardProp: prop => prop !== '$position'
})<ParallaxImageWrapperProps>(({ $position, theme }) => ({
  position: 'absolute',
  width: 'clamp(180px, 22vw, 360px)',
  aspectRatio: '3 / 4',
  top: '50%',
  // Horizontal placement driven by the $position prop
  ...($position === 'left' ? { left: 'clamp(24px, 8vw, 140px)' } : { right: 'clamp(24px, 8vw, 140px)' }),
  // The JS scroll handler overrides transform & opacity in-place via refs.
  // We keep a sensible default here and rely on CSS transition for smoothness.
  transform: 'translateY(calc(-50% + 25%))',
  opacity: 0,
  transition: 'transform 0.12s ease-out, opacity 0.45s ease',
  willChange: 'transform, opacity',
  borderRadius: theme.spacing(3),
  overflow: 'hidden',
  boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
  zIndex: 5,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },
  [theme.breakpoints.down('md')]: {
    width: 'clamp(140px, 28vw, 260px)',
    ...($position === 'left' ? { left: 'clamp(16px, 5vw, 80px)' } : { right: 'clamp(16px, 5vw, 80px)' })
  },
  [theme.breakpoints.down('sm')]: {
    width: 'clamp(110px, 38vw, 180px)',
    ...($position === 'left' ? { left: 12 } : { right: 12 })
  }
}))

// ─── Section 3: About Decentraland ───────────────────────────────────────────

const AboutSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  backgroundColor: '#0d0116',
  zIndex: 2,
  padding: `${theme.spacing(18)} ${theme.spacing(3)} ${theme.spacing(14)}`,
  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(10)} ${theme.spacing(3)} ${theme.spacing(10)}`
  }
}))

const AboutContainer = styled(Box)({
  maxWidth: 860,
  margin: '0 auto',
  textAlign: 'center'
})

const AboutTitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontWeight: 700,
  letterSpacing: -0.5,
  marginBottom: theme.spacing(5),
  [theme.breakpoints.down('sm')]: {
    fontSize: 32,
    marginBottom: theme.spacing(4)
  }
}))

const AboutLead = styled(Typography)(({ theme }) => ({
  color: 'rgba(255,255,255,0.88)',
  fontSize: 20,
  lineHeight: 1.75,
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    fontSize: 17
  }
}))

const AboutBody = styled(Typography)(({ theme }) => ({
  color: 'rgba(255,255,255,0.6)',
  fontSize: 16,
  lineHeight: 1.85,
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    fontSize: 15
  }
}))

const AboutTagline = styled(Typography)(({ theme }) => ({
  color: '#c850f0',
  fontWeight: 600,
  fontSize: 22,
  letterSpacing: 0.3,
  marginTop: theme.spacing(7),
  [theme.breakpoints.down('sm')]: {
    fontSize: 18,
    marginTop: theme.spacing(5)
  }
}))

// ─── Misc ─────────────────────────────────────────────────────────────────────

const SuspenseFallback = styled(Box)({
  minHeight: 200,
  backgroundColor: '#0d0116'
})

export {
  AboutBody,
  AboutContainer,
  AboutLead,
  AboutSection,
  AboutTagline,
  AboutTitle,
  HeroSection,
  HeroSlide,
  HeroSlideContent,
  HeroSlideImage,
  HeroSlideOverlay,
  HeroSlideSubtitle,
  HeroSlideTitle,
  ParallaxImageWrapper,
  ParallaxSection,
  ParallaxSticky,
  SuspenseFallback
}
