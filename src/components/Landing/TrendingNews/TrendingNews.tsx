import * as React from 'react'
import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded'
import { useMobileMediaQuery } from 'decentraland-ui2/dist/components/Media'
import { EffectCoverflow, Navigation } from 'swiper/modules'
import { TrendingNewsSlide } from './TrendingNewsSlide'
import { ContentfulWhatsHotListProps } from '../../../features/landing/landing.types'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import {
  NavigationButton,
  SwiperSlideStyled,
  SwiperStyled,
  TrendingNewsContainer,
  TrendingNewsSection,
  TrendingNewsTitle
} from './TrendingNews.styled'
import type { Swiper as SwiperClass } from 'swiper'
import type { NavigationOptions } from 'swiper/types'

import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/navigation'

const TrendingNews = React.memo((props: ContentfulWhatsHotListProps) => {
  const { list } = props

  const l = useFormatMessage()

  const [sectionInView] = useInView({ threshold: 0.1 })

  const navigationPrevRef = useRef<HTMLButtonElement>(null)
  const navigationNextRef = useRef<HTMLButtonElement>(null)

  const swiperRef = useRef<SwiperClass>()

  const isMobile = useMobileMediaQuery()

  useEffect(() => {
    if (isMobile) return
    if (!swiperRef.current || !navigationPrevRef.current || !navigationNextRef.current) return

    const swiper = swiperRef.current
    // Ensure navigation refs are attached after render
    swiper.params.navigation = {
      ...(swiper.params.navigation as NavigationOptions),
      prevEl: navigationPrevRef.current,
      nextEl: navigationNextRef.current
    }

    if (swiper.navigation) {
      swiper.navigation.destroy?.()
      swiper.navigation.init?.()
      swiper.navigation.update?.()
    }

    return () => {
      swiper.navigation?.destroy?.()
    }
  }, [isMobile])

  return (
    <TrendingNewsSection>
      <TrendingNewsTitle variant="h3">{l('component.landing.whats_hot.title')}</TrendingNewsTitle>
      <TrendingNewsContainer ref={sectionInView}>
        <SwiperStyled
          onBeforeInit={(swiper) => {
            swiperRef.current = swiper
          }}
          modules={[EffectCoverflow, Navigation]}
          loop={true}
          effect="coverflow"
          coverflowEffect={{
            rotate: 25,
            scale: 0.8,
            depth: 250
          }}
          navigation={
            !isMobile && {
              prevEl: navigationPrevRef.current,
              nextEl: navigationNextRef.current
            }
          }
        >
          {list.map((slide, index) => (
            <SwiperSlideStyled key={index}>
              <TrendingNewsSlide key={index} {...slide} />
            </SwiperSlideStyled>
          ))}
        </SwiperStyled>

        {!isMobile && (
          <>
            <NavigationButton direction="prev" ref={navigationPrevRef}>
              <ArrowBackIosNewRoundedIcon />
            </NavigationButton>
            <NavigationButton direction="next" ref={navigationNextRef}>
              <ArrowForwardIosRoundedIcon />
            </NavigationButton>
          </>
        )}
      </TrendingNewsContainer>
    </TrendingNewsSection>
  )
})

export { TrendingNews }
