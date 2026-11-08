import { isAnalyticsOffForVisitor } from './analyticsSessionGate'
import { SegmentEvent } from './segment'
import { postSegmentEvent } from './segmentBeacon'
import type { DeferredClickOptions } from './deferredClickBeacon.types'

/**
 * Sends a `Click` made before analytics was ready through the unload-safe beacon, for clicks that leave the page.
 * Adds the same deferral fields `useDeferredTrack` gives queued clicks, so every deferred click carries them
 * whichever transport sent it. Nothing is sent where analytics stays off (exempt session or bot), unless the click
 * is a conversion: download CTAs live on the exempt `/download` page and their clicks must still count.
 */
function postDeferredClick(properties: Record<string, unknown>, { isConversion = false }: DeferredClickOptions = {}): void {
  if (!isConversion && isAnalyticsOffForVisitor()) return
  const calledAt = Date.now()
  postSegmentEvent(SegmentEvent.CLICK, {
    ...properties,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    track_called_at: calledAt,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    track_delivered_at: Date.now(),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    track_deferred: true
  })
}

export { postDeferredClick }
