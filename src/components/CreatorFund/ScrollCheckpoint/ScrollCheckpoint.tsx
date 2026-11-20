import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import { useMobileMediaQuery } from 'decentraland-ui2'
import { useDeferredTrack } from '../../../hooks/useDeferredTrack'
import { isAnalyticsOffForVisitor } from '../../../modules/analyticsSessionGate'
import { SectionViewedTrack, SegmentEvent } from '../../../modules/segment'
import type { ScrollSection } from '../data'

type ScrollCheckpointProps = {
  name: ScrollSection
}

// A section counts as reached once its top edge is in the upper half of the screen, so a section that only
// peeks in at the bottom doesn't count. Jumping past a section with a navbar link doesn't count it either.
const SCROLL_CHECKPOINT_ROOT_MARGIN = '0px 0px -50% 0px'

/**
 * An empty marker placed right before a Creator Fund section. The first time the visitor reaches it, it sends one
 * `Scroll` event with `place: 'Creator Fund'` and `scroll_to` set to the section's name. Each checkpoint fires at
 * most once per page visit; scrolling back up and down again doesn't repeat it.
 *
 * Sent through `useDeferredTrack`, so a checkpoint reached before Segment loads (the hero, on page load) is queued
 * rather than dropped. Not sent at all where analytics is off for the visitor (bots, exempt sessions), as the
 * tracking guide asks for non-conversion events.
 */
const ScrollCheckpoint = ({ name }: ScrollCheckpointProps) => {
  const deferredTrack = useDeferredTrack()
  const isMobile = useMobileMediaQuery()
  const hasTrackedRef = useRef(false)
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: SCROLL_CHECKPOINT_ROOT_MARGIN })

  useEffect(() => {
    if (!inView || hasTrackedRef.current || isAnalyticsOffForVisitor()) return
    hasTrackedRef.current = true
    deferredTrack(SegmentEvent.SCROLL, {
      place: SectionViewedTrack.CREATOR_FUND,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      scroll_to: name,
      mobile: isMobile
    })
  }, [inView, name, isMobile, deferredTrack])

  return <div ref={ref} aria-hidden="true" data-scroll-checkpoint={name} />
}

export { ScrollCheckpoint }
export type { ScrollCheckpointProps }
