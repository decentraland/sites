import { AllExperiences } from '../components/AllExperiences'
import { LiveNow } from '../components/LiveNow'
import { PageLayout } from '../components/PageLayout/PageLayout'
import { Upcoming } from '../components/Upcoming'
import { useGetLiveNowCardsQuery } from '../features/events'
import { ContentWrapper, MainContainer } from './HomePage.styled'

interface HomePageProps {
  standalone?: boolean
}

function HomePage({ standalone = true }: HomePageProps) {
  const { isLoading: isLiveNowLoading } = useGetLiveNowCardsQuery()

  const content = (
    <MainContainer component="main" standalone={standalone}>
      <ContentWrapper standalone={standalone}>
        <LiveNow />
      </ContentWrapper>
      {!isLiveNowLoading && <Upcoming />}
      {!isLiveNowLoading && <AllExperiences />}
    </MainContainer>
  )

  if (!standalone) {
    return content
  }

  return <PageLayout>{content}</PageLayout>
}

export { HomePage }
