import { type ReactNode, useEffect, useState } from 'react'
import { AnalyticsProvider } from '@dcl/hooks'
import { type ScheduledHandle, cancelScheduledIdleCall, scheduleWhenIdle } from '../utils/scheduleWhenIdle'

interface Props {
  writeKey: string
  cdnUrl?: string
  apiHost?: string
  children: ReactNode
}

/**
 * Wraps @dcl/hooks' AnalyticsProvider so Segment (and its destinations —
 * GTM, GA4, Google Ads, Facebook Pixel, etc.) loads only after the page is
 * idle. The underlying provider reacts to the `writeKey` prop: empty string
 * = no-op, real key = triggers the lazy `import("@segment/analytics-next")`
 * chain. Holding back the key keeps Segment's dependency subtree out of
 * Lighthouse/Lantern's critical-path graph.
 *
 * `cdnUrl` and `apiHost` move the SDK's settings fetch and its event delivery
 * to a first-party proxy, which ad blockers do not match. Both are optional and
 * validated upstream, so an unset or malformed value keeps Segment's own hosts.
 */
function DeferredAnalyticsProvider(props: Props) {
  const { writeKey, cdnUrl, apiHost, children } = props
  const [resolvedKey, setResolvedKey] = useState('')

  useEffect(() => {
    if (!writeKey) return
    let idleHandle: ScheduledHandle | undefined

    const activate = () => setResolvedKey(writeKey)
    const schedule = () => {
      idleHandle = scheduleWhenIdle(activate, { timeout: 4000 })
    }

    // Cover both 'interactive' and 'complete'. The `load` listener still handles
    // the 'loading' case correctly because load fires after readyState becomes
    // complete, so there's no race.
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

  return (
    <AnalyticsProvider writeKey={resolvedKey} cdnUrl={cdnUrl} apiHost={apiHost}>
      {children}
    </AnalyticsProvider>
  )
}

export { DeferredAnalyticsProvider }
