import { Suspense, lazy } from 'react'
import { useInView } from 'react-intersection-observer'
import { useDesktopMediaQuery } from 'decentraland-ui2'
import { Hero } from '../components/Home/Hero'
import { Feed } from './index.types'
import { SuspenseFallback } from './index.styled'

const WhatsOn = lazy(() => import('../components/Home/WhatsOn').then(m => ({ default: m.WhatsOn })))
const CatchTheVibe = lazy(() => import('../components/Home/CatchTheVibe').then(m => ({ default: m.CatchTheVibe })))
const WeeklyRituals = lazy(() => import('../components/Home/WeeklyRituals').then(m => ({ default: m.WeeklyRituals })))
const ComeHangOut = lazy(() => import('../components/Home/ComeHangOut').then(m => ({ default: m.ComeHangOut })))
const FooterLanding = lazy(() =>
  import('decentraland-ui2/dist/components/FooterLanding/FooterLanding').then(m => ({ default: m.FooterLanding }))
)

const IndexPage = () => {
  const isDesktop = useDesktopMediaQuery()
  const { ref: belowFoldRef, inView: belowFoldInView } = useInView({ triggerOnce: true, rootMargin: '200px' })
  const { ref: footerRef, inView: footerInView } = useInView({ triggerOnce: true, rootMargin: '400px' })

  return (
    <>
      <Hero isDesktop={isDesktop} />
      <Suspense fallback={<SuspenseFallback />}>
        <WhatsOn />
      </Suspense>
      <div ref={belowFoldRef}>
        {belowFoldInView && (
          <Suspense fallback={<SuspenseFallback />}>
            <CatchTheVibe />
            <WeeklyRituals />
            <ComeHangOut />
          </Suspense>
        )}
      </div>
      <div ref={footerRef}>
        {footerInView && (
          <Suspense fallback={<SuspenseFallback />}>
            <FooterLanding />
          </Suspense>
        )}
      </div>
    </>
  )
}

export { Feed, IndexPage }
