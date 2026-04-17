import { type ReactNode, useEffect, useState } from 'react'
import { AnalyticsProvider } from '@dcl/hooks'
import { type ScheduledHandle, cancelScheduledIdleCall, scheduleWhenIdle } from '../utils/scheduleWhenIdle'

interface Props {
  writeKey: string
  children: ReactNode
}

/**
 * Wraps @dcl/hooks' AnalyticsProvider so Segment (and its destinations —
 * GTM, GA4, Google Ads, Facebook Pixel, etc.) loads only after the page is
 * idle. The underlying provider reacts to the `writeKey` prop: empty string
 * = no-op, real key = triggers the lazy `import("@segment/analytics-next")`
 * chain. Holding back the key keeps Segment's dependency subtree out of
 * Lighthouse/Lantern's critical-path graph.
 */
function DeferredAnalyticsProvider({ writeKey, children }: Props) {
  const [resolvedKey, setResolvedKey] = useState('')

  useEffect(() => {
    if (!writeKey) return
    let idleHandle: ScheduledHandle | undefined

    const activate = () => setResolvedKey(writeKey)
    const schedule = () => {
      idleHandle = scheduleWhenIdle(activate, { timeout: 4000 })
    }

    if (document.readyState === 'complete') {
      schedule()
    } else {
      window.addEventListener('load', schedule, { once: true })
    }

    return () => {
      window.removeEventListener('load', schedule)
      cancelScheduledIdleCall(idleHandle)
    }
  }, [writeKey])

  return <AnalyticsProvider writeKey={resolvedKey}>{children}</AnalyticsProvider>
}

export { DeferredAnalyticsProvider }
