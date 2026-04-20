import { AllExperiences } from '../../components/explore/AllExperiences'
import { LiveNow } from '../../components/explore/LiveNow'
import { Upcoming } from '../../components/explore/Upcoming'
import { ContentWrapper, MainContainer } from './HomePage.styled'

function HomePage() {
  return (
    <MainContainer component="main">
      <ContentWrapper>
        <LiveNow />
      </ContentWrapper>
      <Upcoming />
      <AllExperiences />
    </MainContainer>
  )
}

export { HomePage }
