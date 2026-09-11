import { useMemo } from 'react'
import { appendReferrer, parseReferrer } from '../utils/referrer'
import { useWalletAddress } from './useWalletAddress'

/**
 * The absolute URL to hand to someone else, carrying the sharer's wallet as
 * `referrer` when they are connected.
 *
 * The attribution does not depend on the target being a `/jump` link: any route
 * that renders a download CTA forwards a `?referrer=` off the current URL
 * (`readUrlReferrer` -> `buildDownloadTrackingParams`), so a human-readable
 * `/places/world/foo.dcl.eth?referrer=0x…` is credited the same as the
 * explorer's `/jump?position=x,y&referrer=0x…` while also carrying an open
 * graph card.
 *
 * The address goes through `parseReferrer`, so a malformed one is dropped
 * rather than shared as a param the installer chain would reject anyway.
 */
// decentraland.org / .zone / .today and their subdomains, plus localhost for the
// dev server. Matches the origin allowlist the SEO function already enforces.
const DECENTRALAND_HOST = /(^|\.)decentraland\.(org|zone|today)$/i

function isDecentralandOrigin(url: URL): boolean {
  if (url.origin === window.location.origin) return true
  return url.protocol === 'https:' && DECENTRALAND_HOST.test(url.hostname)
}

function useShareUrl(target: string): string {
  const { address } = useWalletAddress()

  return useMemo(() => {
    const absolute = new URL(target, window.location.origin)
    // A wallet address is the user's identity, so it only rides on a link back to
    // one of our own sites. Not a plain same-origin check: `JUMP_IN_URL` points at
    // `.org` even while the visitor is on `.zone`, so that would silently drop the
    // attribution on the jump pages. Anything else (a CMS or user-supplied URL a
    // future caller might pass) is shared uncredited.
    if (!isDecentralandOrigin(absolute)) return absolute.toString()
    return appendReferrer(absolute.toString(), parseReferrer(address))
  }, [target, address])
}

export { useShareUrl }
