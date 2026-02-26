import { FooterLanding } from 'decentraland-ui2/dist/components/FooterLanding/FooterLanding'
import { Box, CircularProgress, useDesktopMediaQuery } from 'decentraland-ui2'
import { CreatorsConnect } from '../components/Creators/CreatorsConnect'
import { CreatorsCreate } from '../components/Creators/CreatorsCreate'
import { CreatorsEarn } from '../components/Creators/CreatorsEarn'
import { CreatorsHero } from '../components/Creators/CreatorsHero'
import { CreatorsLearn } from '../components/Creators/CreatorsLearn'
import { CreatorsWhy } from '../components/Creators/CreatorsWhy'
import { Faqs } from '../components/Landing/Faqs'
import { Layout } from '../components/Layout'
import {
  useGetCreatorsConnectQuery,
  useGetCreatorsCreateQuery,
  useGetCreatorsFaqQuery,
  useGetCreatorsHeroQuery,
  useGetCreatorsLearnQuery,
  useGetCreatorsWhyQuery
} from '../features/landing/landing.client'

const CreatePage = () => {
  const isDesktop = useDesktopMediaQuery()

  // Sequential loading: each query fires only after the previous section is ready
  const { data: creatorsHero } = useGetCreatorsHeroQuery()
  const heroReady = !!creatorsHero

  const { data: creatorsWhy } = useGetCreatorsWhyQuery(undefined, { skip: !heroReady })
  const whyReady = heroReady && !!creatorsWhy && creatorsWhy.list.length > 0

  const { data: creatorsCreate } = useGetCreatorsCreateQuery(undefined, { skip: !whyReady })
  const createReady = whyReady && !!creatorsCreate && creatorsCreate.list.length > 0

  const { data: creatorsConnect } = useGetCreatorsConnectQuery(undefined, { skip: !createReady })
  const connectReady = createReady && !!creatorsConnect && creatorsConnect.list.length > 0

  const { data: creatorsLearn } = useGetCreatorsLearnQuery(undefined, { skip: !connectReady })
  const learnReady = connectReady && !!creatorsLearn && creatorsLearn.list.length > 0

  const earnReady = learnReady

  const { data: creatorsFaq } = useGetCreatorsFaqQuery(undefined, { skip: !earnReady })
  const faqReady = earnReady && !!creatorsFaq && creatorsFaq.list.length > 0

  if (!heroReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#18141c' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Layout>
      <CreatorsHero item={creatorsHero} isDesktop={isDesktop} />
      {whyReady && <CreatorsWhy items={creatorsWhy} />}
      {createReady && <CreatorsCreate items={creatorsCreate} />}
      {connectReady && <CreatorsConnect items={creatorsConnect} />}
      {learnReady && <CreatorsLearn items={creatorsLearn} />}
      {earnReady && <CreatorsEarn />}
      {faqReady && <Faqs faqs={creatorsFaq} />}
      {faqReady && <FooterLanding />}
    </Layout>
  )
}

export { CreatePage }
