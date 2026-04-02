import { memo } from 'react'
import { CreatorsConnect } from '../../components/Create/Connect'
import { CreatorsCreate } from '../../components/Create/CreateCards'
import { CreatorsEarn } from '../../components/Create/Earn'
import { CreatorsFaqs } from '../../components/Create/Faqs'
import { CreatorsHero } from '../../components/Create/Hero'
import { CreatorsLearn } from '../../components/Create/Learn'
import { CreatorsWhy } from '../../components/Create/Why'

const CreatePage = memo(() => {
  return (
    <>
      <CreatorsHero />
      <CreatorsWhy />
      <CreatorsCreate />
      <CreatorsConnect />
      <CreatorsLearn />
      <CreatorsEarn />
      <CreatorsFaqs />
    </>
  )
})

export { CreatePage }
