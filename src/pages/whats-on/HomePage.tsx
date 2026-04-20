import { AllExperiences } from '../../components/whats-on/AllExperiences'
import { LiveNow } from '../../components/whats-on/LiveNow'
import { Upcoming } from '../../components/whats-on/Upcoming'
import { useGetLiveNowCardsQuery } from '../../features/whats-on-events'
import { useLiveNowQueryParams } from '../../hooks/useLiveNowQueryParams'
import { ContentWrapper, DeferredGroup, MainContainer } from './HomePage.styled'

function HomePage() {
  const queryParams = useLiveNowQueryParams()
  const { isLoading: isLiveNowLoading } = useGetLiveNowCardsQuery(queryParams)

  return (
    <MainContainer component="main">
      <ContentWrapper>
        <LiveNow />
      </ContentWrapper>
      <DeferredGroup deferred={isLiveNowLoading}>
        <Upcoming />
        <AllExperiences />
      </DeferredGroup>
    </MainContainer>
  )
}

export { HomePage }
