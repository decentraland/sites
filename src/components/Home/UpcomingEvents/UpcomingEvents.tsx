import { memo, useMemo } from 'react'
import 'swiper/css'
import 'swiper/css/pagination'
import { Autoplay, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { AnimatedBackground, EventCard } from 'decentraland-ui2'
import { useGetUpcomingEventsQuery } from '../../../features/events/events.client'
import type { EventEntry } from '../../../features/events/events.types'
import { useFormatMessage } from '../../../hooks/adapters/useFormatMessage'
import { CardsGrid, MobileCarousel, SectionHeader, SectionTitle, SeeAllButton, UpcomingEventsContainer } from './UpcomingEvents.styled'

const LOADING_PLACEHOLDERS = [0, 1, 2]

const UpcomingEventCard = memo(({ event, loading }: { event?: EventEntry; loading?: boolean }) => {
  const coordinates = event ? `${event.x},${event.y}` : undefined
  return (
    <EventCard loading={loading} image={event?.image ?? ''} sceneName={event?.name ?? ''} coordinates={coordinates} hideLocation={false} />
  )
})

UpcomingEventCard.displayName = 'UpcomingEventCard'

const UpcomingEvents = memo(() => {
  const l = useFormatMessage()
  const { data: events, isLoading } = useGetUpcomingEventsQuery()

  const hasNoEvents = !isLoading && (!events || events.length === 0)

  const cardElements = useMemo(
    () =>
      isLoading
        ? LOADING_PLACEHOLDERS.map(i => <UpcomingEventCard key={i} loading />)
        : (events ?? []).map(event => <UpcomingEventCard key={event.id} event={event} />),
    [isLoading, events]
  )

  if (hasNoEvents) return null

  return (
    <UpcomingEventsContainer>
      <AnimatedBackground variant="absolute" />
      <SectionHeader>
        <SectionTitle variant="h3">{l('component.landing.upcoming_events.title')}</SectionTitle>
      </SectionHeader>
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
                  <UpcomingEventCard loading />
                </SwiperSlide>
              ))
            : (events ?? []).map(event => (
                <SwiperSlide key={event.id}>
                  <UpcomingEventCard event={event} />
                </SwiperSlide>
              ))}
        </Swiper>
      </MobileCarousel>
      <SeeAllButton
        variant="outlined"
        component="a"
        href={l('component.landing.upcoming_events.cta_link')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={l('component.landing.upcoming_events.cta')}
      >
        {l('component.landing.upcoming_events.cta')}
      </SeeAllButton>
    </UpcomingEventsContainer>
  )
})

UpcomingEvents.displayName = 'UpcomingEvents'

export { UpcomingEvents }
