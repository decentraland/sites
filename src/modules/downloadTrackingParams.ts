import { readUrlReferrer } from '../utils/referrer'
import { collectCampaignParams } from './campaignParams'

const ANON_USER_ID_PARAM = 'anon_user_id'

/**
 * Builds the param bag every download CTA carries so attribution and the
 * first-launch deep-link survive the hop to `/download`: the campaign `utm_*`
 * params, the `anon_user_id`, the referral `referrer` (from explorer share links
 * like `/jump?position=x,y&referrer=0x…`), and (jump-in only) the
 * `position`/`realm` deep-link params. Shared by `useDownloadModalProps` (the
 * jump-in and discover CTAs) and `useHangOutAction` (navbar + homepage) so the
 * contract lives in one place.
 *
 * Runs during render, so the referrer comes from the side-effect-free
 * `readUrlReferrer` — see its docstring for why `resolveReferrer` is not safe here.
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
