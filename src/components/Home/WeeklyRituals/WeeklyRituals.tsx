import { memo, useRef } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useDesktopMediaQuery } from 'decentraland-ui2'
import { weeklyRitualsContent } from '../../../data/static-content'
import {
  CardImage,
  CarouselWrapper,
  MobileCardImage,
  NavButtonNext,
  NavButtonPrev,
  SectionTitle,
  WeeklyRitualsContainer
} from './WeeklyRituals.styled'

const WeeklyRituals = memo(() => {
  const swiperRef = useRef<SwiperType | null>(null)
  const isDesktop = useDesktopMediaQuery()

  return (
    <WeeklyRitualsContainer>
      <SectionTitle variant="h3">{weeklyRitualsContent.title}</SectionTitle>
      <CarouselWrapper>
        {isDesktop ? (
          <Swiper
            modules={[Pagination, Autoplay, Navigation]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop
            slidesPerView={2}
            spaceBetween={24}
            onSwiper={swiper => {
              swiperRef.current = swiper
            }}
          >
            {weeklyRitualsContent.cards.map(card => (
              <SwiperSlide key={card.id}>
                <CardImage src={card.imageUrl} alt={card.title} loading="lazy" width={1340} height={670} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop
            slidesPerView={1}
            centeredSlides
            spaceBetween={12}
            onSwiper={swiper => {
              swiperRef.current = swiper
            }}
          >
            {weeklyRitualsContent.cards.map(card => (
              <SwiperSlide key={card.id}>
                <MobileCardImage src={card.mobileImageUrl} alt={card.title} loading="lazy" />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
        <NavButtonPrev className="weekly-rituals-nav" onClick={() => swiperRef.current?.slidePrev()}>
          &#8249;
        </NavButtonPrev>
        <NavButtonNext className="weekly-rituals-nav" onClick={() => swiperRef.current?.slideNext()}>
          &#8250;
        </NavButtonNext>
      </CarouselWrapper>
    </WeeklyRitualsContainer>
  )
})

WeeklyRituals.displayName = 'WeeklyRituals'

export { WeeklyRituals }
