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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const segmentId = (window as any).analytics?.user?.()?.anonymousId?.()
    if (typeof segmentId === 'string' && UUID_RE.test(segmentId)) {
      return segmentId
    }

    return undefined
  }, [searchParams])
}

export { ANON_USER_ID_PARAM, useAnonUserId }
