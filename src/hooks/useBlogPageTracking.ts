import { useEffect, useMemo } from 'react'
import { useAnalytics } from '@dcl/hooks'

interface UseBlogPageTrackingArgs {
  name: string | undefined
  properties?: Record<string, unknown>
}

// Per-page Segment `page()` call. Replaces the route-level `usePageTracking` for
// /blog/* so the event fires AFTER the post/category title is resolved — fixing
// the SPA race where `document.title` still shows the previous route when
// navigating /  → /blog/x.
export function useBlogPageTracking({ name, properties }: UseBlogPageTrackingArgs) {
  const { isInitialized, page } = useAnalytics()

  // `propertiesKey` (not `properties`) is the dep so identical-shape rerenders
  // don't re-fire `page()`. Do NOT add `properties` to the dep array — its
  // reference changes every parent render, which would cause a spurious `page()`
  // event on every rerender.
  const propertiesKey = useMemo(() => (properties ? JSON.stringify(properties) : ''), [properties])

  useEffect(() => {
    if (!isInitialized || !name) return
    page(name, properties)
  }, [isInitialized, name, propertiesKey, page])
}
