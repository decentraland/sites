import { memo, useMemo } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { AnimatedBackground } from 'decentraland-ui2'
import { useGetWhatsOnDataQuery } from '../../../features/events/events.client'
import { buildWhatsOnCards } from '../../../features/events/events.helpers'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { WhatsOnCard } from './WhatsOnCard'
import { CardsGrid, MobileCarousel, SectionTitle, WhatsOnContainer } from './WhatsOn.styled'

const LOADING_PLACEHOLDERS = [0, 1, 2]

const WhatsOn = memo(() => {
  const l = useFormatMessage()
  const { data, isLoading } = useGetWhatsOnDataQuery(undefined, { pollingInterval: 60000 })

  const cards = useMemo(() => {
    if (!data) return []
    return buildWhatsOnCards(data.liveEvents, data.hotScenes)
  }, [data])

  if (!isLoading && cards.length === 0) return null

  const cardElements = isLoading
    ? LOADING_PLACEHOLDERS.map(i => <WhatsOnCard key={i} loading />)
    : cards.map(card => <WhatsOnCard key={card.id} card={card} />)

  return (
    <WhatsOnContainer>
      <AnimatedBackground variant="absolute" />
      <SectionTitle variant="h3">{l('component.home.whats_on.title')}</SectionTitle>
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
                  <WhatsOnCard loading />
                </SwiperSlide>
              ))
            : cards.map(card => (
                <SwiperSlide key={card.id}>
                  <WhatsOnCard card={card} />
                </SwiperSlide>
              ))}
        </Swiper>
      </MobileCarousel>
    </WhatsOnContainer>
  )
})

WhatsOn.displayName = 'WhatsOn'

export { WhatsOn }
