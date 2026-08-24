import { Suspense, lazy, memo } from 'react'
import { CreatorsHero } from '../../components/Create/Hero'
import { CreatorsSubnav } from '../../components/Create/Subnav'

const CreatorsWhy = lazy(() => import('../../components/Create/Why').then(m => ({ default: m.CreatorsWhy })))
const CreatorsCreate = lazy(() => import('../../components/Create/CreateCards').then(m => ({ default: m.CreatorsCreate })))
const CreatorsLiveScenes = lazy(() => import('../../components/Create/LiveScenes').then(m => ({ default: m.CreatorsLiveScenes })))
const CreatorsConnect = lazy(() => import('../../components/Create/Connect').then(m => ({ default: m.CreatorsConnect })))
const CreatorsLearn = lazy(() => import('../../components/Create/Learn').then(m => ({ default: m.CreatorsLearn })))
const CreatorsBlog = lazy(() => import('../../components/Create/FromTheBlog').then(m => ({ default: m.CreatorsBlog })))
const CreatorsFaqs = lazy(() => import('../../components/Create/Faqs').then(m => ({ default: m.CreatorsFaqs })))

const CreatePage = memo(() => {
  return (
    <>
      <CreatorsSubnav />
      <CreatorsHero />
      <Suspense fallback={null}>
        <CreatorsWhy />
        <CreatorsCreate />
        <CreatorsLiveScenes />
        <CreatorsConnect />
        <CreatorsLearn />
        <CreatorsBlog />
        {/* NOTE: the Decentraland Studios "hire a creator" section (CreatorsEarn)
            was removed 2026-08 — the Studios registry program is defunct. */}
        <CreatorsFaqs />
      </Suspense>
    </>
  )
})

export { CreatePage }
