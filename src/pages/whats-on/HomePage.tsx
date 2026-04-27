import { AllExperiences } from '../../components/whats-on/AllExperiences'
import { EventDetailModal } from '../../components/whats-on/EventDetailModal'
import { LiveNow } from '../../components/whats-on/LiveNow'
import { Upcoming } from '../../components/whats-on/Upcoming'
import { useGetLiveNowCardsQuery } from '../../features/whats-on-events'
import { useEventDeepLink } from '../../hooks/useEventDeepLink'
import { useLiveNowQueryParams } from '../../hooks/useLiveNowQueryParams'
import topBackground from '../../images/whats-on/images/top_background.webp'
import { ContentWrapper, DeferredGroup, MainContainer, TopBackgroundImage } from './HomePage.styled'

function HomePage() {
  const queryParams = useLiveNowQueryParams()
  const { isLoading: isLiveNowLoading } = useGetLiveNowCardsQuery(queryParams)
  const { isOpen, modalData, closeDeepLink } = useEventDeepLink()

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
      <EventDetailModal open={isOpen} onClose={closeDeepLink} data={modalData} />
    </MainContainer>
  )
}

export { HomePage }
