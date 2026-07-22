import { collectCampaignParams } from './campaignParams'

const ANON_USER_ID_PARAM = 'anon_user_id'

/**
 * Builds the param bag every download CTA carries so attribution and the
 * first-launch deep-link survive the hop to `/download`: the campaign `utm_*`
 * params, the `anon_user_id`, and (jump-in only) the `position`/`realm`
 * deep-link params. Shared by `useLaunchExplorer` and `useHangOutAction` so the
 * contract lives in one place.
 */
const buildDownloadTrackingParams = (
  anonUserId: string | undefined,
  deepLinkParams: Record<string, string | undefined> = {}
): Record<string, string | undefined | null> => ({
  ...deepLinkParams,
  ...collectCampaignParams(),
  [ANON_USER_ID_PARAM]: anonUserId
})

export { buildDownloadTrackingParams }
