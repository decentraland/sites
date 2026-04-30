import { useEffect, useRef, useState } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { SegmentEvent } from '../modules/segment'

type LegacyRedirectOrigin = 'events' | 'places'

interface UseLegacyRedirectTrackingArgs {
  origin: LegacyRedirectOrigin
  source: string
  destination: string
  preservedParams: Record<string, string>
}

// Cap the wait for analytics initialization. DeferredAnalyticsProvider hangs
// the Segment write key on requestIdleCallback (4s timeout), so on a cold load
// directly into a legacy URL we may not have isInitialized yet. We delay the
// Navigate by at most this long to give analytics a chance to flush, then
// redirect regardless. Misses on very-cold loads are acceptable for what is
// operational telemetry, not critical-path data.
const REDIRECT_TIMEOUT_MS = 800

const EVENT_BY_ORIGIN: Record<LegacyRedirectOrigin, SegmentEvent> = {
  events: SegmentEvent.LEGACY_EVENTS_REDIRECTED,
  places: SegmentEvent.LEGACY_PLACES_REDIRECTED
}

function useLegacyRedirectTracking({ origin, source, destination, preservedParams }: UseLegacyRedirectTrackingArgs): boolean {
  const { isInitialized, track } = useAnalytics()
  const [ready, setReady] = useState(false)
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    if (isInitialized) {
      try {
        track(EVENT_BY_ORIGIN[origin], {
          source,
          destination,
          origin,
          preservedParams,
          timestamp: new Date().toISOString()
        })
      } catch {
        // Analytics is best-effort; never block the redirect on a Segment failure
        // (adblocker shim, plugin error, etc.) — the user lands on /whats-on regardless.
      }
      fired.current = true
      setReady(true)
      return
    }
    const timer = setTimeout(() => setReady(true), REDIRECT_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [isInitialized, origin, source, destination, preservedParams, track])

  return ready
}

export type { LegacyRedirectOrigin }
export { useLegacyRedirectTracking }
