import { type SyntheticEvent, useCallback, useRef } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { isAnalyticsOffForVisitor } from '../modules/analyticsSessionGate'
import { postDeferredClick } from '../modules/deferredClickBeacon'
import { SegmentEvent } from '../modules/segment'
import { isSameTabNavigation } from '../utils/isSameTabNavigation'
import { buildClickPayload } from './adapters/clickPayload.helpers'
import { useDeferredTrack } from './useDeferredTrack'

type ClickLikeEvent = SyntheticEvent<HTMLElement> & Partial<Pick<MouseEvent, 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>>

// A click replaces the page only when it follows a real link in this tab; in-page anchors,
// mailto links, buttons and new-tab links leave the page alive.
function leavesPage(event: ClickLikeEvent): boolean {
  const element = event.currentTarget
  if (!(element instanceof HTMLAnchorElement)) return false
  const href = element.getAttribute('href') ?? ''
  if (!href || href.startsWith('#') || href.startsWith('mailto:')) return false
  return isSameTabNavigation({
    currentTarget: element,
    ctrlKey: Boolean(event.ctrlKey),
    metaKey: Boolean(event.metaKey),
    shiftKey: Boolean(event.shiftKey),
    altKey: Boolean(event.altKey)
  })
}

/**
 * `useTrackClick` for pages whose links can navigate away before Segment boots. Builds the same
 * `Click` payload from the element's `data-*` attributes, then picks the transport the way the
 * site navbar does:
 * - analytics ready → the deferred queue (sends at once, with the SDK's full context);
 * - not ready and the page stays (anchor, new tab, button) → the queue, unless analytics never
 *   boots for this visitor;
 * - not ready and the click replaces the page → the unload-safe beacon (`postDeferredClick`).
 */
function useUnloadSafeTrackClick() {
  const { isInitialized } = useAnalytics()
  // Read through a ref so the handler keeps its identity when analytics becomes ready.
  const isInitializedRef = useRef(isInitialized)
  isInitializedRef.current = isInitialized
  const deferredTrack = useDeferredTrack()

  return useCallback(
    (event: ClickLikeEvent) => {
      const payload = buildClickPayload(event.currentTarget)
      if (isInitializedRef.current) {
        deferredTrack(SegmentEvent.CLICK, payload)
        return
      }
      if (!leavesPage(event)) {
        if (!isAnalyticsOffForVisitor()) deferredTrack(SegmentEvent.CLICK, payload)
        return
      }
      postDeferredClick(payload)
    },
    [deferredTrack]
  )
}

export { useUnloadSafeTrackClick }
