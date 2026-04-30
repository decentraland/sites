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

  // Snapshot the legacy URL at mount. <Navigate> drives location.search to the
  // new path before this component unmounts, so a deps-based effect would
  // re-run with source='/whats-on' and either fire the track late with the
  // wrong source, or — if the timer branch released ready without setting
  // fired — emit a duplicate event for the destination instead of the origin.
  const argsRef = useRef({ origin, source, destination, preservedParams })
  const trackRef = useRef(track)
  trackRef.current = track

  useEffect(() => {
    if (fired.current) return
    if (isInitialized) {
      const args = argsRef.current
      try {
        trackRef.current(EVENT_BY_ORIGIN[args.origin], {
          source: args.source,
          destination: args.destination,
          origin: args.origin,
          preservedParams: args.preservedParams,
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
    const timer = setTimeout(() => {
      fired.current = true
      setReady(true)
    }, REDIRECT_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [isInitialized])

  return ready
}

export type { LegacyRedirectOrigin }
export { useLegacyRedirectTracking }
