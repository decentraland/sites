import { AllExperiences } from '../../components/explore/AllExperiences'
import { LiveNow } from '../../components/explore/LiveNow'
import { Upcoming } from '../../components/explore/Upcoming'
import { useGetLiveNowCardsQuery } from '../../features/explore-events'
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
