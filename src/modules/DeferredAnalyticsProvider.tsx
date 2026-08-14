import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import type { AnalyticsBrowser } from '@segment/analytics-next'
import { AnalyticsContext } from '@dcl/hooks'
import { type ScheduledHandle, cancelScheduledIdleCall, scheduleWhenIdle } from '../utils/scheduleWhenIdle'

interface Props {
  writeKey: string
  cdnURL?: string
  apiHost?: string
  children: ReactNode
}

/**
 * Deferred analytics provider with first-party proxy support.
 *
 * Wraps the `AnalyticsContext` from `@dcl/hooks` so all downstream
 * `useAnalytics()` consumers work unchanged. Loads `@segment/analytics-next`
 * lazily after the page is idle, and passes optional `cdnURL` and `apiHost`
 * proxy settings to `AnalyticsBrowser.load()`:
 *
 * - `cdnURL` overrides where the SDK fetches project settings from (default:
 *   `cdn.segment.com`). Set to a first-party proxy origin to avoid ad-blocker
 *   filter lists.
 * - `apiHost` overrides where the SDK delivers events (default:
 *   `api.segment.io/v1`). Format: `host/basePath` without protocol.
 *
 * The deferred pattern keeps Segment's dependency subtree out of Lighthouse /
 * Lantern's critical-path graph: the real write key is held back until the
 * browser is idle (or 4 s, whichever comes first).
 */
function DeferredAnalyticsProvider({ writeKey, cdnURL, apiHost, children }: Props) {
  const [resolvedKey, setResolvedKey] = useState('')
  const analyticsRef = useRef<AnalyticsBrowser | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Phase 1: defer the write key until idle.
  useEffect(() => {
    if (!writeKey) return
    let idleHandle: ScheduledHandle | undefined

    const activate = () => setResolvedKey(writeKey)
    const schedule = () => {
      idleHandle = scheduleWhenIdle(activate, { timeout: 4000 })
    }

    if (document.readyState !== 'loading') {
      schedule()
    } else {
      window.addEventListener('load', schedule, { once: true })
    }

    return () => {
      window.removeEventListener('load', schedule)
      cancelScheduledIdleCall(idleHandle)
    }
  }, [writeKey])

  // Phase 2: once the key is resolved, load analytics-next with proxy options.
  useEffect(() => {
    if (!resolvedKey) return

    let cancelled = false

    const load = async () => {
      const userAgent = navigator.userAgent

      // Dynamically import isbot to match @dcl/hooks behaviour.
      const { isbot } = await import('isbot')
      if (isbot(userAgent)) {
        console.log('[Analytics] Skipping load: bot detected')
        return
      }

      try {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { AnalyticsBrowser } = await import('@segment/analytics-next')

        const settings: { writeKey: string; cdnURL?: string } = { writeKey: resolvedKey }
        if (cdnURL) {
          settings.cdnURL = cdnURL
        }

        // Segment.io is the fixed integration key used by @segment/analytics-next.
        const segmentIoKey = 'Segment.io'
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const options: { integrations?: { 'Segment.io'?: { apiHost?: string } } } = {}
        if (apiHost) {
          options.integrations = { [segmentIoKey]: { apiHost } }
        }

        const instance = AnalyticsBrowser.load(settings, options)
        if (!cancelled) {
          analyticsRef.current = instance
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('[Analytics] Failed to initialize:', error)
        analyticsRef.current = null
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [resolvedKey, cdnURL, apiHost])

  const contextValue = useMemo(() => {
    if (!analyticsRef.current || !isInitialized) {
      return {
        isInitialized: false,
        track: () => {},
        identify: () => {},
        page: () => {}
      }
    }

    const analytics = analyticsRef.current
    return {
      isInitialized: true,
      track: (event: string, payload?: Record<string, unknown>) => {
        analytics.track(event, payload)
      },
      identify: (id: string, traits?: Record<string, unknown>) => {
        analytics.identify(id, traits)
      },
      page: (name: string, props?: Record<string, unknown>) => {
        analytics.page(name, props)
      }
    }
  }, [isInitialized])

  return <AnalyticsContext.Provider value={contextValue}>{children}</AnalyticsContext.Provider>
}

export { DeferredAnalyticsProvider }
