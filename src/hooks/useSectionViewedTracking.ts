import { useEffect, useRef } from 'react'
import { useMobileMediaQuery } from 'decentraland-ui2'
import { SegmentEvent } from '../modules/segment'
import type { SectionViewedTrack } from '../modules/segment'
import { useDeferredTrack } from './useDeferredTrack'

/**
 * Fires the `Section Viewed` event once, the first time `inView` flips to true
 * for the given section. Restores the scroll-depth signal the standalone
 * landing emitted before the Vite migration dropped it — same event name and
 * payload shape (`section_viewed` + `mobile`) so the existing warehouse table
 * (`LANDING.SECTION_VIEWED`) and Metabase card resume receiving data without
 * any warehouse-side change.
 *
 * Uses `useDeferredTrack` (not the beacon transport): `/create` is a content
 * page users scroll through, not one they abruptly leave mid-flow, so the
 * component-scoped queue is the right default per the tracking-events guide.
 *
 * `mobile` is derived from ui2's canonical mobile breakpoint (`down('xs')`,
 * i.e. max-width 767.95px) so the flag matches the device experience.
 */
function useSectionViewedTracking(place: SectionViewedTrack | undefined, inView: boolean): void {
  const deferredTrack = useDeferredTrack()
  const isMobile = useMobileMediaQuery()
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    if (!place || !inView || hasTrackedRef.current) return
    hasTrackedRef.current = true
    deferredTrack(SegmentEvent.SECTION_VIEWED, {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      section_viewed: place,
      mobile: isMobile
    })
  }, [place, inView, isMobile, deferredTrack])
}

export { useSectionViewedTracking }
