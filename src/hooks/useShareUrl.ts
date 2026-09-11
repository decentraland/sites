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
function useShareUrl(target: string): string {
  const { address } = useWalletAddress()

  return useMemo(() => {
    const absolute = new URL(target, window.location.origin).toString()
    return appendReferrer(absolute, parseReferrer(address))
  }, [target, address])
}

export { useShareUrl }
