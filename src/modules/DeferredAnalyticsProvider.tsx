import { type ReactNode, useEffect, useState } from 'react'
import { AnalyticsProvider } from '@dcl/hooks'

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
    let idleHandle: number | undefined
    let timeoutHandle: number | undefined

    const activate = () => setResolvedKey(writeKey)

    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(activate, { timeout: 4000 })
      } else {
        timeoutHandle = window.setTimeout(activate, 2000)
      }
    }

    if (document.readyState === 'complete') {
      schedule()
    } else {
      window.addEventListener('load', schedule, { once: true })
    }

    return () => {
      window.removeEventListener('load', schedule)
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle)
      }
      if (timeoutHandle !== undefined) {
        window.clearTimeout(timeoutHandle)
      }
    }
  }, [writeKey])

  return <AnalyticsProvider writeKey={resolvedKey}>{children}</AnalyticsProvider>
}

export { DeferredAnalyticsProvider }
