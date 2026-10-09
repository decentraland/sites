import { SegmentEvent } from './segment'
import { ensureSegmentAnonymousId } from './segmentAnonymousId'
import { postSegmentEvent } from './segmentBeacon'

/**
 * Sends a `Click` made before analytics was ready through the unload-safe beacon, for clicks that leave the page.
 * Adds the same deferral fields `useDeferredTrack` gives queued clicks, so every deferred click carries them
 * whichever transport sent it. It applies no gate of its own: the navbar skips exempt sessions and bots before
 * calling, while download CTAs skip neither, since clicks on the exempt `/download` page must still count.
 */
function postDeferredClick(properties: Record<string, unknown>): void {
  const calledAt = Date.now()
  postSegmentEvent(
    SegmentEvent.CLICK,
    {
      ...properties,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      track_called_at: calledAt,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      track_delivered_at: Date.now(),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      track_deferred: true
    },
    ensureSegmentAnonymousId()
  )
}

export { postDeferredClick }
