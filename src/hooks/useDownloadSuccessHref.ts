import { useCallback } from 'react'
import { collectCampaignParams } from '../modules/campaignParams'
import { buildDownloadSuccessHref } from '../modules/url'
import { useAnonUserId } from './useAnonUserId'

/**
 * Returns a memoized `(os, place) => href` builder for `/download_success`
 * links, baking in the current anon_user_id and any partner UTM params on the
 * page URL. Shared by the landing/play download CTAs — it centralizes their
 * os/place call sites. (`DownloadOptions` composes the same options inline via
 * `buildDownloadSuccessHref` because it also passes `arch`.)
 */
function useDownloadSuccessHref() {
  const anonUserId = useAnonUserId()

  return useCallback(
    (os: string, place: string) => buildDownloadSuccessHref(os, place, { anonUserId, campaignParams: collectCampaignParams() }),
    [anonUserId]
  )
}

export { useDownloadSuccessHref }
