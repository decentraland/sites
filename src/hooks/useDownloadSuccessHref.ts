import { useCallback } from 'react'
import { collectCampaignParams } from '../modules/campaignParams'
import { buildDownloadSuccessHref } from '../modules/url'
import { useAnonUserId } from './useAnonUserId'

/**
 * Returns a memoized `(os, place) => href` builder for `/download_success`
 * links, baking in the current anon_user_id and any partner UTM params on the
 * page URL. Shared by Hero, ComeHangOut, and /play so a change to the
 * attribution payload only needs one edit instead of three.
 */
function useDownloadSuccessHref() {
  const anonUserId = useAnonUserId()

  return useCallback(
    (os: string, place: string) => buildDownloadSuccessHref(os, place, { anonUserId, campaignParams: collectCampaignParams() }),
    [anonUserId]
  )
}

export { useDownloadSuccessHref }
