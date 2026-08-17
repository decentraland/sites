import { useMemo } from 'react'
import { getEnv } from '../config/env'

/**
 * Adds `referrer` to a URL that may be absolute or relative, preserving its shape.
 *
 * Parsed rather than concatenated: string manipulation puts the query in the
 * wrong place when the value carries a hash fragment, and appends a second
 * `referrer` when one is already there. `searchParams.set` handles both, and the
 * absolute/relative shape is restored afterwards because auth may validate the
 * redirect target it receives.
 */
const appendReferrer = (url: string, referrer?: string): string => {
  if (!referrer) return url

  const wasAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(url)
  const parsed = new URL(url, window.location.origin)
  parsed.searchParams.set('referrer', referrer)

  return wasAbsolute ? parsed.toString() : `${parsed.pathname}${parsed.search}${parsed.hash}`
}

const useReferralUrl = (referrer?: string, directDownload = false) => {
  return useMemo(() => {
    const downloadUrl = getEnv('DOWNLOAD_URL') || '/download'

    if (directDownload) {
      // Direct download flow: the referrer travels with the download URL and is
      // consumed by the installer attribution chain (gateway → launcher → explorer)
      const url = new URL(downloadUrl, window.location.origin)
      if (referrer) {
        url.searchParams.set('referrer', referrer)
      }
      return url.toString()
    }

    const authUrl = getEnv('AUTH_URL') || '/auth'
    const tempUrl = new URL(authUrl, window.location.origin)
    tempUrl.pathname = '/auth/login'
    if (referrer) {
      tempUrl.searchParams.set('referrer', referrer)
    }
    // The referrer rides on `redirectTo` as well, not just as an auth param.
    // Auth consumes its own `referrer` while the visitor goes through sign-up,
    // but it forwards the visitor to `redirectTo` verbatim — so a plain
    // `/download` dropped the attribution for anyone auth bounces straight
    // through (an existing session, or a profile that needs no setup), and the
    // installer chain downstream never saw a referrer.
    // The env value may be absolute or relative, so append rather than reparse.
    tempUrl.searchParams.set('redirectTo', appendReferrer(downloadUrl, referrer))
    return tempUrl.toString()
  }, [referrer, directDownload])
}

export { useReferralUrl }
