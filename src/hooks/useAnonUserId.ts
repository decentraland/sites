import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Query parameter name used across the download flow. */

const ANON_USER_ID_PARAM = 'anon_user_id'

/**
 * Returns the anonymous user ID for campaign attribution.
 *
 * Priority: URL param `anon_user_id` > Segment anonymous ID.
 *
 * The URL param is used for re-download flows (the `/download_success` page
 * receives it from `DownloadOptions` via the redirect query string).
 * The Segment fallback is the primary source on the initial download page.
 *
 * **Note:** The Segment fallback is NOT reactive. `useMemo` depends only on
 * `searchParams`. If Segment's SDK initializes after the first render and
 * there's no URL param, the hook returns `undefined` for that render cycle.
 * This is acceptable because the download page loads Segment early via
 * `AnalyticsProvider`, and the URL-param path (re-downloads) doesn't depend
 * on the SDK at all.
 *
 * Both sources are validated against UUID format to prevent malformed strings
 * from flowing into download URLs and analytics events.
 */
function useAnonUserId(): string | undefined {
  const [searchParams] = useSearchParams()

  return useMemo(() => {
    const fromUrl = searchParams.get(ANON_USER_ID_PARAM)
    if (fromUrl && UUID_RE.test(fromUrl)) {
      return fromUrl
    }

    // @segment/analytics-next stores the anonymous ID in localStorage under
    // this key. We read it directly because the AnalyticsBrowser instance is
    // not exposed globally (unlike the legacy analytics.js snippet).
    const segmentId = localStorage.getItem('ajs_anonymous_id')
    if (segmentId) {
      // The value may be stored JSON-encoded (e.g. "\"uuid\""), so strip quotes
      const cleaned = segmentId.replace(/^"|"$/g, '')
      if (UUID_RE.test(cleaned)) {
        return cleaned
      }
    }

    return undefined
  }, [searchParams])
}

export { ANON_USER_ID_PARAM, useAnonUserId }
