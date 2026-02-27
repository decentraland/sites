import { CircularProgress, useDesktopMediaQuery } from 'decentraland-ui2'
import { CreatorsHero } from '../components/Creators/CreatorsHero'
import { Layout } from '../components/Layout'
import { useGetCreatorsHeroQuery } from '../features/create/create.client'
import { CreateLoadingContainer } from './create.styled'

const CreatePage = () => {
  const isDesktop = useDesktopMediaQuery()

  // Sequential loading: each query fires only after the previous section is ready
  const { data: creatorsHero } = useGetCreatorsHeroQuery()
  const heroReady = !!creatorsHero

  if (!heroReady) {
    return (
      <CreateLoadingContainer>
        <CircularProgress />
      </CreateLoadingContainer>
    )
  }

  return (
    <Layout>
      <CreatorsHero item={creatorsHero} isDesktop={isDesktop} />
    </Layout>
  )
}

export { CreatePage }
