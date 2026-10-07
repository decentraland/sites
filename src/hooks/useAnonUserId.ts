import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAnalytics } from '@dcl/hooks'
import { readSegmentAnonymousId } from '../modules/segmentAnonymousId'
import { UUID_V1_5_RE } from '../modules/segmentAnonymousId.helpers'

/** Query parameter name used across the download flow. */

const ANON_USER_ID_PARAM = 'anon_user_id'

/**
 * Returns the anonymous user ID for campaign attribution.
 *
 * Priority: URL attribution > current Segment identity (SDK, cookie, localStorage).
 *
 * The URL param is used for re-download flows (the `/download_success` page
 * receives it from upstream landings via the redirect query string).
 * The Segment fallback is the primary source on direct landings.
 *
 * The provider initialization flag triggers another lookup. It signals that
 * the buffered AnalyticsBrowser exists, not that its SDK has finished loading;
 * the resolver only reads the synchronous SDK instance after it resolves.
 * Before SDK boot this lookup does not mint. A loaded SDK getter may create or
 * synchronize its identity; URL attribution is never promoted into one.
 *
 * Both sources are validated against UUID format to prevent malformed strings
 * from flowing into download URLs and analytics events.
 */
function useAnonUserId(): string | undefined {
  const [searchParams] = useSearchParams()
  const { isInitialized } = useAnalytics()

  return useMemo(() => {
    const fromUrl = searchParams.get(ANON_USER_ID_PARAM)
    if (fromUrl && UUID_V1_5_RE.test(fromUrl)) {
      return fromUrl
    }

    // The resolved SDK getter can mint or resync; it never adopts the URL id.
    const segmentId = readSegmentAnonymousId()
    return segmentId && UUID_V1_5_RE.test(segmentId) ? segmentId : undefined
    // `isInitialized` participates in deps so the memo re-runs when Segment
    // starts loading and persisted identity can be re-read.
  }, [searchParams, isInitialized])
}

export { ANON_USER_ID_PARAM, useAnonUserId }
