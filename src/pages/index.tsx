import { Suspense, lazy, useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useDesktopMediaQuery } from 'decentraland-ui2'
import { Hero } from '../components/Home/Hero'
import { useGetExploreDataQuery } from '../features/events/events.client'
import { cancelScheduledIdleCall, scheduleWhenIdle } from '../utils/scheduleWhenIdle'
import { BelowFoldContent, SuspenseFallback } from './index.styled'

const Explore = lazy(() => import('../components/Home/Explore').then(m => ({ default: m.Explore })))
const CatchTheVibe = lazy(() => import('../components/Home/CatchTheVibe').then(m => ({ default: m.CatchTheVibe })))
const WeeklyRituals = lazy(() => import('../components/Home/WeeklyRituals').then(m => ({ default: m.WeeklyRituals })))
const ComeHangOut = lazy(() => import('../components/Home/ComeHangOut').then(m => ({ default: m.ComeHangOut })))

// Subscribes to the explore data store. Rendering this triggers the fetch;
// keeping it isolated lets IndexPage gate the subscription on idle without
// subscribing IndexPage itself (which would force re-renders on every poll).
const ExplorePrefetcher = () => {
  useGetExploreDataQuery()
  return null
}

const IndexPage = () => {
  const isDesktop = useDesktopMediaQuery()

  // Defer the explore prefetch until the browser is idle so it doesn't race
  // with the hero image for bandwidth during the LCP window on mobile.
  const [idlePrefetch, setIdlePrefetch] = useState(false)
  useEffect(() => {
    const handle = scheduleWhenIdle(() => setIdlePrefetch(true), { timeout: 4000, fallbackDelayMs: 3000 })
    return () => cancelScheduledIdleCall(handle)
  }, [])

  // The -1px bottom rootMargin means the observer only fires once the user
  // scrolls at least 1px past the hero, so initial layout doesn't render the
  // below-fold tree and kick off its own queries.
  const { ref: belowFoldRef, inView: belowFoldInView } = useInView({ triggerOnce: true, rootMargin: '0px 0px -1px 0px' })

  const shouldPrefetch = idlePrefetch || belowFoldInView

  return (
    <>
      <Hero isDesktop={isDesktop} />
      {shouldPrefetch && <ExplorePrefetcher />}
      <div ref={belowFoldRef}>
        {belowFoldInView && (
          <Suspense fallback={<SuspenseFallback />}>
            <BelowFoldContent>
              <Explore />
              <CatchTheVibe />
              <WeeklyRituals />
              <ComeHangOut />
            </BelowFoldContent>
          </Suspense>
        )}
      </div>
    </>
  )
}

export { IndexPage }
