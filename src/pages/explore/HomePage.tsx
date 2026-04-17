import { AllExperiences } from '../../components/explore/AllExperiences'
import { LiveNow } from '../../components/explore/LiveNow'
import { Upcoming } from '../../components/explore/Upcoming'
import { useGetLiveNowCardsQuery } from '../../features/explore-events'
import { ContentWrapper, MainContainer } from './HomePage.styled'

function HomePage() {
  const { isLoading: isLiveNowLoading } = useGetLiveNowCardsQuery()

  return (
    <MainContainer component="main">
      <ContentWrapper>
        <LiveNow />
      </ContentWrapper>
      {!isLiveNowLoading && <Upcoming />}
      {!isLiveNowLoading && <AllExperiences />}
    </MainContainer>
  )
}

export { HomePage }
