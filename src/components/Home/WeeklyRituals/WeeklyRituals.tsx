import { memo, useRef } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useGetWeeklyRitualsQuery } from '../../../features/landing/landing.client'
import {
  CardImage,
  CarouselWrapper,
  EdgeFadeLeft,
  EdgeFadeRight,
  NavButtonNext,
  NavButtonPrev,
  SectionTitle,
  WeeklyRitualsContainer
} from './WeeklyRituals.styled'

const WeeklyRituals = memo(() => {
  const { data, isLoading } = useGetWeeklyRitualsQuery()
  const swiperRef = useRef<SwiperType | null>(null)

  if (isLoading || !data || data.list.length === 0) {
    return null
  }

  return (
    <WeeklyRitualsContainer>
      <SectionTitle variant="h3">{data.title}</SectionTitle>
      <CarouselWrapper>
        <EdgeFadeLeft />
        <EdgeFadeRight />
        <Swiper
          modules={[Pagination, Autoplay, Navigation]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop
          slidesPerView={1.2}
          centeredSlides
          spaceBetween={24}
          breakpoints={{
            // eslint-disable-next-line @typescript-eslint/naming-convention
            600: { slidesPerView: 2.3, centeredSlides: false },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            960: { slidesPerView: 2.5, centeredSlides: false }
          }}
          onSwiper={swiper => {
            swiperRef.current = swiper
          }}
        >
          {data.list.map(card => (
            <SwiperSlide key={card.id}>{card.image?.url && <CardImage src={card.image.url} alt={card.title} loading="lazy" />}</SwiperSlide>
          ))}
        </Swiper>
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
