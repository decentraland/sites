import { memo, useMemo } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { AnimatedBackground } from 'decentraland-ui2'
import { useGetExploreDataQuery } from '../../../features/events/events.client'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { ExploreCard } from './ExploreCard'
import { CardsGrid, ExploreContainer, MobileCarousel, SectionTitle } from './Explore.styled'

const LOADING_PLACEHOLDERS = [0, 1, 2]

const Explore = memo(() => {
  const l = useFormatMessage()
  const { data: cards = [], isLoading } = useGetExploreDataQuery(undefined, { pollingInterval: 60000 })

  if (!isLoading && cards.length === 0) return null

  const cardElements = useMemo(
    () =>
      isLoading
        ? LOADING_PLACEHOLDERS.map(i => <ExploreCard key={i} loading />)
        : cards.map(card => <ExploreCard key={card.id} card={card} />),
    [isLoading, cards]
  )

  return (
    <ExploreContainer>
      <AnimatedBackground variant="absolute" />
      <SectionTitle variant="h3">{l('page.home.explore.title')}</SectionTitle>
      <CardsGrid>{cardElements}</CardsGrid>
      <MobileCarousel>
        <Swiper
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          slidesPerView={1}
          spaceBetween={16}
        >
          {isLoading
            ? LOADING_PLACEHOLDERS.map(i => (
                <SwiperSlide key={i}>
                  <ExploreCard loading />
                </SwiperSlide>
              ))
            : cards.map(card => (
                <SwiperSlide key={card.id}>
                  <ExploreCard card={card} />
                </SwiperSlide>
              ))}
        </Swiper>
      </MobileCarousel>
    </ExploreContainer>
  )
})

Explore.displayName = 'Explore'

export { Explore }
