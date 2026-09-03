import { readUrlReferrer } from '../utils/referrer'
import { collectCampaignParams } from './campaignParams'

const ANON_USER_ID_PARAM = 'anon_user_id'

/**
 * Builds the param bag every download CTA carries so attribution and the
 * first-launch deep-link survive the hop to `/download`: the campaign `utm_*`
 * params, the `anon_user_id`, the referral `referrer`, and (jump-in only) the
 * `position`/`realm` deep-link params. Shared by `useDownloadModalProps` (the
 * jump-in and discover CTAs) and `useHangOutAction` (navbar + homepage) so the
 * contract lives in one place.
 *
 * The `referrer` exists for the scene share links the explorer emits
 * (`/jump?position=x,y&referrer=0x…`): the jump-in CTA raises the DownloadModal
 * when no client is installed, and the address used to die at the modal.
 * `/download` reads `?referrer=` and forces the gateway installer route for it,
 * so the gateway → launcher → explorer attribution chain only ever sees a
 * referrer that survived this hop.
 *
 * Deliberately `readUrlReferrer` and not `resolveReferrer`, on two counts.
 * Purity: this runs during render on every route the navbar mounts, and
 * `resolveReferrer` clears the stored referrer when the URL carries an invalid
 * one — a render must not discard attribution. Scope: `resolveReferrer` falls
 * back to the stored value, which would attribute a download started from the
 * homepage to a referral picked up earlier in the tab. That fallback is not
 * needed here anyway, because `/download` resolves the stored value itself; the
 * only thing lost in this hop was the query param.
 */
const buildDownloadTrackingParams = (
  anonUserId: string | undefined,
  deepLinkParams: Record<string, string | undefined> = {}
): Record<string, string | undefined | null> => {
  const referrer = readUrlReferrer()

  return {
    ...deepLinkParams,
    ...collectCampaignParams(),
    [ANON_USER_ID_PARAM]: anonUserId,
    ...(referrer ? { referrer } : {})
  }
}

export { buildDownloadTrackingParams }
