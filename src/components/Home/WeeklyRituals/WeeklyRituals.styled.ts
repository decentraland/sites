import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const WeeklyRitualsContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(4),
  padding: `${theme.spacing(10)} 0`,
  width: '100%',
  overflow: 'hidden',
  background: 'radial-gradient(ellipse at 110% 50%, rgba(148,37,205,1) 0%, rgba(104,20,155,1) 100%)',
  [theme.breakpoints.down('sm')]: {
    padding: `${theme.spacing(6)} 0`
  }
}))

const SectionTitle = styled(Typography)(({ theme }) => ({
  color: dclColors.neutral.white,
  fontWeight: 600,
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    fontSize: 32
  }
}))

const CarouselWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  paddingTop: theme.spacing(3),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '&:hover .weekly-rituals-nav': {
    opacity: 1
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper': {
    paddingBottom: theme.spacing(5),
    overflow: 'visible',
    margin: '0 80px',
    [theme.breakpoints.down('sm')]: {
      margin: 0
    }
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-slide': {
    height: 370,
    borderRadius: 16,
    overflow: 'hidden',
    opacity: 0.5,
    transition: 'opacity 0.3s ease, box-shadow 0.3s ease',
    [theme.breakpoints.down('sm')]: {
      height: 'auto',
      opacity: 1,
      borderRadius: 16,
      overflow: 'hidden'
    }
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-slide-active, & .swiper-slide-next': {
    opacity: 1,
    boxShadow: '0px 2px 8px 8px rgba(255, 255, 255, 0.15)',
    [theme.breakpoints.down('sm')]: {
      boxShadow: 'none'
    }
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-pagination': {
    bottom: '0 !important'
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-pagination-bullet': {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    opacity: 1,
    width: 8,
    height: 8
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  '& .swiper-pagination-bullet-active': {
    backgroundColor: dclColors.neutral.white
  }
}))

const CardImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  borderRadius: 16
})

const MobileCardImage = styled('img')({
  display: 'block',
  width: 358,
  maxWidth: '100%',
  margin: '0 auto',
  borderRadius: 16,
  objectFit: 'cover'
})

const NavButton = styled('button')(({ theme }) => ({
  position: 'absolute',
  top: '50%',
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
  fontSize: 24
}))

const NavButtonPrev = styled(NavButton)(({ theme }) => ({
  left: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    left: theme.spacing(1)
  }
}))

const NavButtonNext = styled(NavButton)(({ theme }) => ({
  right: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    right: theme.spacing(1)
  }
}))

export { CardImage, CarouselWrapper, MobileCardImage, NavButtonNext, NavButtonPrev, SectionTitle, WeeklyRitualsContainer }
