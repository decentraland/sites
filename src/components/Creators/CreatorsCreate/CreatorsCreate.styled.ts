import { Swiper, SwiperSlide } from 'swiper/react'
import { Typography, dclColors, styled } from 'decentraland-ui2'

const CreatorsCreateSection = styled('section')(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(12.5, 0),
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('xs')]: {
    padding: theme.spacing(6, 0)
  }
}))

const CreatorsCreateTitle = styled(Typography)(({ theme }) => ({
  textAlign: 'center',
  fontWeight: 600,
  fontSize: '48px',
  lineHeight: '77px',
  marginBottom: theme.spacing(4),
  padding: theme.spacing(0, 5),
  color: dclColors.neutral.softWhite,
  ['& span']: {
    background: `linear-gradient(244deg, ${dclColors.brand.ruby} -11.67%, ${dclColors.brand.yellow} 88.23%)`,
    backgroundClip: 'text',
    ['WebkitBackgroundClip']: 'text',
    ['WebkitTextFillColor']: 'transparent'
  },
  [theme.breakpoints.down('xs')]: {
    fontSize: '32px',
    lineHeight: '40px',
    letterSpacing: '-0.64px',
    padding: theme.spacing(0, 2)
  }
}))

const CreatorsCreateSwiperStyled = styled(Swiper)({
  width: '100%',
  paddingBottom: '50px !important',
  ['& .swiper-pagination']: {
    bottom: 0
  },
  ['& .swiper-pagination-bullet']: {
    backgroundColor: dclColors.neutral.gray5,
    opacity: 0.5,
    width: '20px',
    height: '4px',
    borderRadius: '2px'
  },
  ['& .swiper-pagination-bullet-active']: {
    backgroundColor: dclColors.neutral.white,
    opacity: 1
  },
  ['& .swiper-button-prev::after, & .swiper-button-next::after']: {
    color: dclColors.neutral.softWhite
  }
})

const CreatorsCreateSwiperSlideStyled = styled(SwiperSlide)({
  ['&.swiper-slide']: {
    width: 'auto'
  }
})

export { CreatorsCreateSection, CreatorsCreateSwiperSlideStyled, CreatorsCreateSwiperStyled, CreatorsCreateTitle }
