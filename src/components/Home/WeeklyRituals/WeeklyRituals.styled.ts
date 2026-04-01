import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const WeeklyRitualsOuter = styled(Box)({
  width: '100%',
  background: 'radial-gradient(ellipse at 110% 50%, rgba(148,37,205,1) 0%, rgba(104,20,155,1) 100%)'
})

const WeeklyRitualsContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(4),
  padding: `${theme.spacing(10)} 0`,
  width: '100%',
  maxWidth: 1920,
  margin: '0 auto',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(6)} 0`
  }
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontWeight: 600,
  fontSize: 48,
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    fontSize: 32
  }
}))

const CarouselWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  paddingTop: theme.spacing(3),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover .weekly-rituals-nav': {
    opacity: 1
  }
}))

const CarouselTrack = styled('div')({
  display: 'flex',
  alignItems: 'stretch',
  willChange: 'transform',
  cursor: 'grab',
  userSelect: 'none',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:active': {
    cursor: 'grabbing'
  }
})

const CarouselSlide = styled('div')(({ theme }) => ({
  flexShrink: 0,
  borderRadius: 16,
  overflow: 'hidden',
  opacity: 0.7,
  transform: 'scale(0.8)',
  transition: 'opacity 0.4s ease, box-shadow 0.4s ease, transform 0.4s ease',
  aspectRatio: '750 / 370',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.active': {
    opacity: 1,
    transform: 'scale(1)',
    boxShadow: '0px 2px 8px 8px rgba(255, 255, 255, 0.15)'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.prev': {
    maskImage: 'linear-gradient(to right, transparent 0%, black 50%)',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 50%)',
    [theme.breakpoints.down('sm')]: {
      maskImage: 'none',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      WebkitMaskImage: 'none'
    }
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.next': {
    maskImage: 'linear-gradient(to right, black 50%, transparent 100%)',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 100%)',
    [theme.breakpoints.down('sm')]: {
      maskImage: 'none',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      WebkitMaskImage: 'none'
    }
  },
  [theme.breakpoints.down('sm')]: {
    aspectRatio: 'auto',
    opacity: 1,
    transform: 'scale(1)',
    display: 'flex',
    justifyContent: 'center',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '&.active': {
      boxShadow: 'none'
    }
  }
}))

const CarouselDots = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  gap: 8,
  paddingTop: 24,
  position: 'relative',
  zIndex: 3
})

const CarouselDot = styled('button')({
  width: 8,
  height: 8,
  borderRadius: '50%',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  backgroundColor: 'rgba(255, 255, 255, 0.4)',
  transition: 'background-color 0.3s ease',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&.active': {
    backgroundColor: '#fff'
  }
})

const CardImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
})

const MobileCardImage = styled('img')({
  display: 'block',
  width: '100%',
  maxWidth: 358,
  margin: '0 auto',
  borderRadius: 16,
  objectFit: 'cover'
})

const NavButton = styled('button')(({ theme }) => ({
  position: 'absolute',
  top: '45%',
  transform: 'translateY(-50%)',
  zIndex: 10,
  width: 48,
  height: 48,
  borderRadius: '50%',
  border: '2px solid rgba(255, 255, 255, 0.5)',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  color: dclColors.neutral.white,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: theme.transitions.create('opacity', {
    duration: theme.transitions.duration.short
  }),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.6)'
  },
  fontSize: 24,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '@media (max-width: 991px)': {
    display: 'none'
  }
}))

const NavButtonPrev = styled(NavButton)(({ theme }) => ({
  left: theme.spacing(3)
}))

const NavButtonNext = styled(NavButton)(({ theme }) => ({
  right: theme.spacing(3)
}))

export {
  CardImage,
  CarouselDot,
  CarouselDots,
  CarouselSlide,
  CarouselTrack,
  CarouselWrapper,
  MobileCardImage,
  NavButtonNext,
  NavButtonPrev,
  SectionTitle,
  WeeklyRitualsContainer,
  WeeklyRitualsOuter
}
