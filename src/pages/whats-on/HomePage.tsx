import { AllExperiences } from '../../components/whats-on/AllExperiences'
import { EventDetailModal } from '../../components/whats-on/EventDetailModal'
import { LiveNow } from '../../components/whats-on/LiveNow'
import { PlaceDetailModal } from '../../components/whats-on/PlaceDetailModal'
import { Upcoming } from '../../components/whats-on/Upcoming'
import { useGetLiveNowCardsQuery } from '../../features/experiences/events'
import { useEventDeepLink } from '../../hooks/useEventDeepLink'
import { useLiveNowQueryParams } from '../../hooks/useLiveNowQueryParams'
import { usePlaceDeepLink } from '../../hooks/usePlaceDeepLink'
import topBackground from '../../images/whats-on/images/top_background.webp'
import { ContentWrapper, DeferredGroup, MainContainer, TopBackgroundImage } from './HomePage.styled'

function HomePage() {
  const queryParams = useLiveNowQueryParams()
  const { isLoading: isLiveNowLoading } = useGetLiveNowCardsQuery(queryParams)
  const event = useEventDeepLink()
  const place = usePlaceDeepLink()

  return (
    <MainContainer component="main">
      <TopBackgroundImage src={topBackground} alt="" aria-hidden="true" loading="eager" decoding="async" width={1440} height={700} />
      <ContentWrapper>
        <LiveNow />
      </ContentWrapper>
      <DeferredGroup deferred={isLiveNowLoading}>
        <Upcoming />
        <AllExperiences />
      </DeferredGroup>
      <EventDetailModal open={event.isOpen} onClose={event.closeDeepLink} data={event.modalData} />
      <PlaceDetailModal open={place.isOpen && !event.isOpen} onClose={place.closeDeepLink} data={place.modalData} />
    </MainContainer>
  )
}

export { HomePage }
