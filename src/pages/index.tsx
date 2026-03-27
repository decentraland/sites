import { Suspense, lazy } from 'react'
import { useInView } from 'react-intersection-observer'
import { useDesktopMediaQuery } from 'decentraland-ui2'
import { Hero } from '../components/Home/Hero'
import { Feed } from './index.types'
import { BelowFoldContent, SuspenseFallback } from './index.styled'

const WhatsOn = lazy(() => import('../components/Home/WhatsOn').then(m => ({ default: m.WhatsOn })))
const CatchTheVibe = lazy(() => import('../components/Home/CatchTheVibe').then(m => ({ default: m.CatchTheVibe })))
const WeeklyRituals = lazy(() => import('../components/Home/WeeklyRituals').then(m => ({ default: m.WeeklyRituals })))
const ComeHangOut = lazy(() => import('../components/Home/ComeHangOut').then(m => ({ default: m.ComeHangOut })))
const UpcomingEvents = lazy(() => import('../components/Home/UpcomingEvents').then(m => ({ default: m.UpcomingEvents })))
const FooterLanding = lazy(() =>
  import('decentraland-ui2/dist/components/FooterLanding/FooterLanding').then(m => ({ default: m.FooterLanding }))
)

const IndexPage = () => {
  const isDesktop = useDesktopMediaQuery()
  // Negative bottom margin (-1px) prevents the observer from triggering on initial load.
  // Hero is 100vh so belowFoldRef sits exactly at the viewport's bottom edge — any positive
  // or zero rootMargin would include it, firing API calls (hot-scenes, events) during the LCP window.
  // With -1px the element must be at least 1px inside the viewport to intersect, which requires a scroll.
  const { ref: belowFoldRef, inView: belowFoldInView } = useInView({ triggerOnce: true, rootMargin: '0px 0px -1px 0px' })
  const { ref: footerRef, inView: footerInView } = useInView({ triggerOnce: true, rootMargin: '400px' })

  return (
    <>
      <Hero isDesktop={isDesktop} />
      <div ref={belowFoldRef}>
        {belowFoldInView && (
          <Suspense fallback={<SuspenseFallback />}>
            <BelowFoldContent>
              <WhatsOn />
              <CatchTheVibe />
              <WeeklyRituals />
              <ComeHangOut />
              <UpcomingEvents />
            </BelowFoldContent>
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
