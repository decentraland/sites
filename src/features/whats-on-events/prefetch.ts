import type { HotScene } from './events.helpers'
import type { EventsResponse } from './events.types'

interface WhatsOnPrefetch {
  eventsUrl: string
  scenesUrl: string
  events: Promise<EventsResponse | null>
  scenes: Promise<HotScene[] | null>
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __dclWhatsOnPrefetch?: WhatsOnPrefetch
  }
}

// The inline `<script>` in index.html starts the Live Now API fetches before
// the main bundle even parses, so the response is in flight while React boots.
// Returns a one-shot prefetch — once consumed, the Promise reference is cleared
// so a manual refetch (polling, RTK invalidation) goes through the normal path.
function consumeWhatsOnPrefetch(eventsUrl: string, scenesUrl: string): Pick<WhatsOnPrefetch, 'events' | 'scenes'> | null {
  if (typeof window === 'undefined') return null
  const prefetch = window.__dclWhatsOnPrefetch
  if (!prefetch) return null
  if (prefetch.eventsUrl !== eventsUrl || prefetch.scenesUrl !== scenesUrl) return null

  const consumed = { events: prefetch.events, scenes: prefetch.scenes }
  window.__dclWhatsOnPrefetch = undefined
  return consumed
}

export { consumeWhatsOnPrefetch }
export type { WhatsOnPrefetch }
