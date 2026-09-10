import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAnalytics } from '@dcl/hooks'
import { readStorageItem } from '../utils/safeStorage'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Query parameter name used across the download flow. */

const ANON_USER_ID_PARAM = 'anon_user_id'

/**
 * Returns the anonymous user ID for campaign attribution.
 *
 * Priority: URL param `anon_user_id` > Segment anonymous ID in localStorage.
 *
 * The URL param is used for re-download flows (the `/download_success` page
 * receives it from upstream landings via the redirect query string).
 * The Segment fallback is the primary source on direct landings.
 *
 * **Reactivity:** the `useAnalytics().isInitialized` flag is included in the
 * memo dependencies. When Segment finishes its lazy boot and writes
 * `ajs_anonymous_id` to localStorage, the hook re-evaluates and returns the
 * newly-available ID. Consumers that derive URLs from the result (Hero's
 * `buildDownloadSuccessHref`, DownloadSuccess's gateway URL) get the up-to-date
 * value on the next render after init.
 *
 * Both sources are validated against UUID format to prevent malformed strings
 * from flowing into download URLs and analytics events.
 */
function useAnonUserId(): string | undefined {
  const [searchParams] = useSearchParams()
  const { isInitialized } = useAnalytics()

  return useMemo(() => {
    const fromUrl = searchParams.get(ANON_USER_ID_PARAM)
    if (fromUrl && UUID_RE.test(fromUrl)) {
      return fromUrl
    }

    // @segment/analytics-next stores the anonymous ID in localStorage under
    // this key. We read it directly because the AnalyticsBrowser instance is
    // not exposed globally (unlike the legacy analytics.js snippet). The read
    // goes through `readStorageItem` because this runs inside the navbar, where
    // a WebView with no usable storage would otherwise blank the page
    // (SITES-2RY).
    const segmentId = readStorageItem('ajs_anonymous_id')
    if (segmentId) {
      // The value may be stored JSON-encoded (e.g. "\"uuid\""), so strip quotes
      const cleaned = segmentId.replace(/^"|"$/g, '')
      if (UUID_RE.test(cleaned)) {
        return cleaned
      }
    }

    return undefined
    // `isInitialized` participates in deps so the memo re-runs when Segment
    // boots and `ajs_anonymous_id` becomes available.
  }, [searchParams, isInitialized])
}

export { ANON_USER_ID_PARAM, useAnonUserId }
