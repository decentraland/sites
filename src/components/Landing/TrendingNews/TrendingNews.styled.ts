import { Swiper, SwiperSlide } from 'swiper/react'
import { Box, Typography, dclColors, styled } from 'decentraland-ui2'

const TrendingNewsSection = styled('section')(({ theme }) => {
  return {
    width: '100%',
    padding: 0,
    margin: theme.spacing(18.75, 0),
    position: 'relative',
    zIndex: 15,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.default,
    overflow: 'hidden'
  }
})

const TrendingNewsTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(6)
}))

const TrendingNewsContainer = styled(Box)(({ theme }) => {
  return {
    maxWidth: '520px',
    width: '520px',
    margin: '0 auto',
    [theme.breakpoints.down('xs')]: {
      width: '80vw',
      maxWidth: '80vw'
    }
  }
})

const SwiperStyled = styled(Swiper)({ '&.swiper': { overflow: 'visible' } })

const SwiperSlideStyled = styled(SwiperSlide)(({ theme }) => {
  return {
    '&.swiper-slide': {
      borderRadius: '20px',
      overflow: 'hidden'
    },
    '& .swiper-slide-shadow-left': {
      backgroundImage: `linear-gradient(to left, ${theme.palette.background.default}, rgba(22, 21, 24, 0))!important`
    },
    '& .swiper-slide-shadow-right': {
      backgroundImage: `linear-gradient(to right, ${theme.palette.background.default}, rgba(22, 21, 24, 0))!important`
    }
  }
})

const NavigationButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'direction'
})<{ direction: 'prev' | 'next' }>((props) => {
  const { direction, theme } = props
  return {
    position: 'absolute',
    top: '50%',
    zIndex: 10,
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: theme.transitions.create(['background-color']),
    '& svg': {
      color: dclColors.neutral.gray0
    },
    [direction === 'prev' ? 'left' : 'right']: '42px',
    '&:hover': {
      backgroundColor: '#736f7db8'
    }
  }
})

export { TrendingNewsSection, TrendingNewsTitle, TrendingNewsContainer, SwiperStyled, SwiperSlideStyled, NavigationButton }
