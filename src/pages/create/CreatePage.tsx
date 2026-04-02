import { Suspense, lazy, memo } from 'react'
import { CreatorsHero } from '../../components/Create/Hero'

const CreatorsWhy = lazy(() => import('../../components/Create/Why').then(m => ({ default: m.CreatorsWhy })))
const CreatorsCreate = lazy(() => import('../../components/Create/CreateCards').then(m => ({ default: m.CreatorsCreate })))
const CreatorsConnect = lazy(() => import('../../components/Create/Connect').then(m => ({ default: m.CreatorsConnect })))
const CreatorsLearn = lazy(() => import('../../components/Create/Learn').then(m => ({ default: m.CreatorsLearn })))
const CreatorsEarn = lazy(() => import('../../components/Create/Earn').then(m => ({ default: m.CreatorsEarn })))
const CreatorsFaqs = lazy(() => import('../../components/Create/Faqs').then(m => ({ default: m.CreatorsFaqs })))

const CreatePage = memo(() => {
  return (
    <>
      <CreatorsHero />
      <Suspense fallback={null}>
        <CreatorsWhy />
        <CreatorsCreate />
        <CreatorsConnect />
        <CreatorsLearn />
        <CreatorsEarn />
        <CreatorsFaqs />
      </Suspense>
    </>
  )
})

export { CreatePage }
