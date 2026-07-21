import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdvancedUserAgentData, useAnalytics } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { mapEnvToDclenv } from '../config/dclenv'
import { buildDeepLinkOptions } from '../features/places/places.helpers'
import { DOWNLOAD_URLS, detectDownloadOS } from '../modules/downloadConstants'
import { buildDownloadTrackingParams } from '../modules/downloadTrackingParams'
import { SegmentEvent } from '../modules/segment'
import { buildTrackedDownloadUrl } from '../modules/url'
import { useAnonUserId } from './useAnonUserId'

interface LaunchExplorerOptions {
  /** Deep-link position ("x,y"). `DEFAULT_POSITION` keeps it out of the deep link. Also reported to analytics. */
  position: string
  realm?: string
}

interface DownloadModalProps {
  os: ReturnType<typeof detectDownloadOS>
  downloadUrl: string
  epicUrl: string
  googlePlayUrl: string
  appStoreUrl: string
}

/**
 * Shared "open the explorer" behavior (JumpInButton, EditProfileButton): mobile goes to the
 * store, desktop deep-links via `launchDesktopApp`, and a missing client falls back to the
 * DownloadModal (the caller renders it). The modal's download URL carries the deep-link
 * (position/realm) plus the tracking params (campaign utm_*, anon_user_id) so attribution and
 * first-launch location survive the hop to `/download`.
 */
function useLaunchExplorer({ position, realm }: LaunchExplorerOptions) {
  const [searchParams] = useSearchParams()
  const [, advancedUserAgent] = useAdvancedUserAgentData()
  const { track } = useAnalytics()
  const anonUserId = useAnonUserId()
  const [isDownloadModalOpen, setDownloadModalOpen] = useState(false)

  const explorerEnv = searchParams.get('dclenv') ?? mapEnvToDclenv(searchParams.get('env'))
  const sceneConsole = searchParams.get('scene-console') ?? undefined

  const osName = advancedUserAgent?.os?.name ?? 'unknown'
  const arch = advancedUserAgent?.cpu?.architecture?.toLowerCase() ?? 'unknown'
  const isMobile = Boolean(advancedUserAgent?.mobile)
  const downloadOs = detectDownloadOS()

  // Default-filtered deep-link params. Without the `env` arg this never emits
  // `dclenv`, and it drops `position: ''` (the manual `!== DEFAULT` check let
  // empty strings through as `?position=`).
  const deepLinkParams = useMemo(() => buildDeepLinkOptions(position, realm), [position, realm])

  // NOTE: 2026-07-21 — the fallback used to redirect straight to DOWNLOAD_URL /
  // ONBOARDING_URL (env). It now always opens the DownloadModal (same UX as the
  // homepage) so the user picks their platform instead of being bounced to
  // /download; the modal's URLs still carry the deep-link + tracking params.
  const openDownloadFallback = useCallback(() => setDownloadModalOpen(true), [])

  const launchExplorer = useCallback(async () => {
    if (isMobile) {
      const storeUrl = downloadOs === 'android' ? DOWNLOAD_URLS.googlePlay : DOWNLOAD_URLS.appStore
      track(SegmentEvent.GO_TO_EXPLORER, { position, realm, osName, arch, target: 'mobile-store' })
      window.open(storeUrl, '_self')
      return
    }

    track(SegmentEvent.GO_TO_EXPLORER, { position, realm, osName, arch })

    try {
      const launched = await launchDesktopApp(buildDeepLinkOptions(position, realm, explorerEnv, sceneConsole))
      if (!launched) {
        track(SegmentEvent.CLICK, { event: SegmentEvent.CLIENT_NOT_INSTALLED, os: osName, arch })
        openDownloadFallback()
      }
    } catch {
      openDownloadFallback()
    }
  }, [isMobile, downloadOs, track, position, realm, explorerEnv, sceneConsole, osName, arch, openDownloadFallback])

  const closeDownloadModal = useCallback(() => setDownloadModalOpen(false), [])

  // The modal's primary CTA lands on `/download`; carry the deep-link params
  // (first-launch position/realm) and the tracking params (campaign utm_* +
  // anon_user_id) so both survive the hop and the funnel join stays intact.
  const downloadUrlParams = buildDownloadTrackingParams(anonUserId, deepLinkParams)
  const downloadModalProps: DownloadModalProps = {
    os: downloadOs,
    downloadUrl: buildTrackedDownloadUrl(downloadOs === 'apple' ? DOWNLOAD_URLS.apple : DOWNLOAD_URLS.windows, downloadUrlParams),
    epicUrl: DOWNLOAD_URLS.epic,
    googlePlayUrl: DOWNLOAD_URLS.googlePlay,
    appStoreUrl: DOWNLOAD_URLS.appStore
  }

  return { launchExplorer, isMobile, isDownloadModalOpen, closeDownloadModal, downloadModalProps }
}

export { useLaunchExplorer }
export type { LaunchExplorerOptions }
