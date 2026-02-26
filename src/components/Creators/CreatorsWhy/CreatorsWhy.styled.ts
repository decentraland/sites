import { Swiper, SwiperSlide } from 'swiper/react'
import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const CreatorsWhySection = styled('section')(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(12.5, 5),
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(6, 2)
  }
}))

const CreatorsWhyTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontSize: '48px',
  fontWeight: 600,
  lineHeight: '56.16px',
  marginBottom: theme.spacing(6),
  ['& span']: {
    background: `linear-gradient(244deg, ${dclColors.brand.ruby} -11.67%, ${dclColors.brand.yellow} 88.23%)`,
    backgroundClip: 'text',
    ['WebkitBackgroundClip']: 'text',
    ['WebkitTextFillColor']: 'transparent'
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '32px',
    lineHeight: '38px',
    marginBottom: theme.spacing(4)
  }
}))

const CreatorsWhyGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: theme.spacing(4),
  maxWidth: '1200px',
  margin: '0 auto',
  [theme.breakpoints.down('md')]: {
    gridTemplateColumns: 'repeat(2, 1fr)'
  },
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}))

const CreatorsWhyCarousel = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.down('sm')]: {
    display: 'block',
    width: '100%'
  }
}))

const CreatorsWhySwiperStyled = styled(Swiper)({
  width: '100%',
  paddingBottom: '40px !important',
  ['& .swiper-pagination']: {
    bottom: 0
  }
})

const CreatorsWhySwiperSlideStyled = styled(SwiperSlide)({
  height: 'auto'
})

export { CreatorsWhyCarousel, CreatorsWhyGrid, CreatorsWhySection, CreatorsWhySwiperSlideStyled, CreatorsWhySwiperStyled, CreatorsWhyTitle }
