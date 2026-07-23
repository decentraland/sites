import { useEffect, useMemo } from 'react'
import { useAnalytics } from '@dcl/hooks'

interface UsePageViewTrackingArgs {
  name: string | undefined
  properties?: Record<string, unknown>
}

// Per-page Segment `page()` call, fired once analytics is initialized. Use it on
// any page that owns its own page view instead of the route-level
// `usePageTracking` in `Layout` — i.e. Layout-less routes (404, cast) and pages
// whose title resolves asynchronously (blog post/category, storage). Originally
// added for /blog/* to fix the SPA race where the event fired before the title
// resolved; it is domain-neutral and used across blog, storage, cast, social and
// the 404 page.
export function usePageViewTracking({ name, properties }: UsePageViewTrackingArgs) {
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
