import { getEnv } from '../config/env'
import { DOWNLOAD_URLS, detectDownloadOS } from '../modules/downloadConstants'
import { buildDownloadTrackingParams } from '../modules/downloadTrackingParams'
import { buildTrackedDownloadUrl } from '../modules/url'
import { useAnonUserId } from './useAnonUserId'
import { useTotalDownloads } from './useTotalDownloads'

interface DownloadModalProps {
  os: ReturnType<typeof detectDownloadOS>
  downloadUrl: string
  epicUrl: string
  googlePlayUrl: string
  appStoreUrl: string
  i18n: { totalDownloads: string }
}

/**
 * Builds the `DownloadModal` props for the "install first" fallback, shared by
 * every surface that raises it (homepage `useLaunchExplorer`, discover jump-in).
 * The primary CTA lands on `/download` carrying the deep-link (first-launch
 * position/realm) plus the tracking params (campaign utm_* + anon_user_id) so
 * attribution and the destination survive the hop and the funnel join stays
 * intact. `deepLinkParams` come from `buildDeepLinkOptions` (default-filtered).
 */
function useDownloadModalProps(deepLinkParams: { position?: string; realm?: string }): DownloadModalProps {
  const anonUserId = useAnonUserId()
  const totalDownloads = useTotalDownloads()
  const downloadOs = detectDownloadOS()

  const downloadUrlParams = buildDownloadTrackingParams(anonUserId, deepLinkParams)
  // Prefer the env `DOWNLOAD_URL` (relative on dev/zone → resolved against the
  // current origin by `buildTrackedDownloadUrl`, so the download stays on the
  // zone origin and keeps its identity) and fall back to the platform constant.
  const downloadBase = getEnv('DOWNLOAD_URL') ?? (downloadOs === 'apple' ? DOWNLOAD_URLS.apple : DOWNLOAD_URLS.windows)

  return {
    os: downloadOs,
    downloadUrl: buildTrackedDownloadUrl(downloadBase, downloadUrlParams),
    epicUrl: DOWNLOAD_URLS.epic,
    googlePlayUrl: DOWNLOAD_URLS.googlePlay,
    appStoreUrl: DOWNLOAD_URLS.appStore,
    i18n: { totalDownloads: `Total Downloads: ${totalDownloads}` }
  }
}

export { useDownloadModalProps }
export type { DownloadModalProps }
