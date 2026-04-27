import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Query parameter name used across the download flow. */

const ANON_USER_ID_PARAM = 'anon_user_id'

function readFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/(?:^|;\s*)ajs_anonymous_id=([^;]+)/)
  if (!match) return undefined
  // The cookie value is URL-encoded and may be wrapped in quotes (depending on
  // which Segment SDK wrote it). Normalise both.
  let value: string
  try {
    value = decodeURIComponent(match[1])
  } catch {
    value = match[1]
  }
  value = value.replace(/^%22|%22$|^"|"$/g, '')
  return UUID_RE.test(value) ? value : undefined
}

function readFromLocalStorage(): string | undefined {
  try {
    const segmentId = localStorage.getItem('ajs_anonymous_id')
    if (!segmentId) return undefined
    const cleaned = segmentId.replace(/^"|"$/g, '')
    return UUID_RE.test(cleaned) ? cleaned : undefined
  } catch {
    return undefined
  }
}

/**
 * Returns the anonymous user ID for campaign attribution.
 *
 * Priority: URL param `anon_user_id` > cookie `ajs_anonymous_id` > localStorage.
 *
 * The URL param is used for re-download flows (the `/download_success` page
 * receives it from `DownloadOptions` via the redirect query string). The
 * cookie is the canonical Segment storage and the only one shared across
 * subdomains/origins on `.decentraland.org` — the localStorage fallback only
 * matters in dev or when cookie storage is disabled.
 *
 * Reading the cookie first matters for the funnel: `auth` uses analytics.js v1
 * (cookie-only), so to ensure CP1 (landing) and CP2 (auth) end up with the
 * same `user_id` the landing has to surface the same value the auth page sees.
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

    return readFromCookie() ?? readFromLocalStorage()
  }, [searchParams])
}

export { ANON_USER_ID_PARAM, useAnonUserId }
