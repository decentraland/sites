import { memo, useRef } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useDesktopMediaQuery, useMediaQuery } from 'decentraland-ui2'
import { weeklyRitualsContent } from '../../../data/static-content'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import {
  CardImage,
  CarouselWrapper,
  MobileCardImage,
  NavButtonNext,
  NavButtonPrev,
  SectionTitle,
  WeeklyRitualsContainer,
  WeeklyRitualsOuter
} from './WeeklyRituals.styled'

const WeeklyRituals = memo(() => {
  const l = useFormatMessage()
  const swiperRef = useRef<SwiperType | null>(null)
  const isDesktop = useDesktopMediaQuery()
  const isTablet = useMediaQuery('(min-width: 600px) and (max-width: 991px)')

  return (
    <WeeklyRitualsOuter>
      <WeeklyRitualsContainer>
        <SectionTitle variant="h3">{l('page.home.weekly_rituals.title')}</SectionTitle>
        <CarouselWrapper>
          {isDesktop ? (
            <Swiper
              modules={[Pagination, Navigation]}
              pagination={{ clickable: true }}
              loop
              slidesPerView="auto"
              centeredSlides
              spaceBetween={24}
              initialSlide={0}
              onSwiper={swiper => {
                swiperRef.current = swiper
              }}
            >
              {/* Duplicate cards so Swiper has enough slides (6) for loop with fractional slidesPerView */}
              {[...weeklyRitualsContent.cards, ...weeklyRitualsContent.cards].map((card, i) => (
                <SwiperSlide key={`${card.id}-${i}`}>
                  <a href={card.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', height: '100%' }}>
                    <CardImage src={card.imageUrl} alt={l(card.titleKey)} loading="lazy" />
                  </a>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : isTablet ? (
            <Swiper
              modules={[Pagination, Autoplay]}
              pagination={{ clickable: true }}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              loop
              slidesPerView={2}
              spaceBetween={16}
              onSwiper={swiper => {
                swiperRef.current = swiper
              }}
            >
              {weeklyRitualsContent.cards.map(card => (
                <SwiperSlide key={card.id}>
                  <a href={card.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center' }}>
                    <MobileCardImage src={card.mobileImageUrl} alt={l(card.titleKey)} loading="lazy" />
                  </a>
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
                  <a href={card.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center' }}>
                    <MobileCardImage src={card.mobileImageUrl} alt={l(card.titleKey)} loading="lazy" />
                  </a>
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
    </WeeklyRitualsOuter>
  )
})

WeeklyRituals.displayName = 'WeeklyRituals'

export { WeeklyRituals }
