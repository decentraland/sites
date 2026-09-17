import { useCallback, useMemo, useState } from 'react'
import { useAnalytics } from '@dcl/hooks'
import { buildDeepLinkOptions } from '../features/places/places.helpers'
import { SegmentEvent } from '../modules/segment'
import { useDownloadModalProps } from './useDownloadModalProps'
import { isClientNotInstalled, shouldPromptDownload, useExplorerLauncher } from './useExplorerLauncher'

interface LaunchExplorerOptions {
  /** Deep-link position ("x,y"). `DEFAULT_POSITION` keeps it out of the deep link. Also reported to analytics. */
  position: string
  realm?: string
}

/**
 * Shared "open the explorer" behavior (JumpInButton, EditProfileButton): both tiers fire the
 * `decentraland://` protocol, a phone falls back to the store and a desktop without the client
 * falls back to the DownloadModal (the caller renders it). The modal's download URL carries the deep-link
 * (position/realm) plus the tracking params (campaign utm_*, anon_user_id) so attribution and
 * first-launch location survive the hop to `/download`.
 */
function useLaunchExplorer({ position, realm }: LaunchExplorerOptions) {
  const { track } = useAnalytics()
  const { launch, isMobile, osName, arch } = useExplorerLauncher()
  const [isDownloadModalOpen, setDownloadModalOpen] = useState(false)

  // Default-filtered deep-link params for the download fallback. Only
  // position/realm on purpose: the `?dclenv`/`?scene-console`/`?multi-instance`
  // params describe a launch, and this URL is consumed on first run after an
  // install, when there is no other instance to sit beside. It also drops
  // `position: ''` (the manual `!== DEFAULT` check let empty strings through as
  // `?position=`).
  const deepLinkParams = useMemo(() => buildDeepLinkOptions({ position, realm }), [position, realm])

  const launchExplorer = useCallback(async () => {
    // NOTE: 2026-09-16 — `target` was 'mobile-store', when that was the only
    // thing a mobile tap could do. It now names the first step (the protocol);
    // whether it fell back to the store isn't known yet at track time.
    track(SegmentEvent.GO_TO_EXPLORER, { position, realm, osName, arch, ...(isMobile ? { target: 'mobile-app' } : {}) })

    const outcome = await launch({ position, realm })
    // NOTE: 2026-07-21 — the fallback used to redirect straight to DOWNLOAD_URL /
    // ONBOARDING_URL (env). It now always opens the DownloadModal (same UX as the
    // homepage) so the user picks their platform; the modal's URLs still carry
    // the deep-link + tracking params.
    if (shouldPromptDownload(outcome)) {
      if (isClientNotInstalled(outcome)) track(SegmentEvent.CLICK, { event: SegmentEvent.CLIENT_NOT_INSTALLED, os: osName, arch })
      setDownloadModalOpen(true)
    }
  }, [track, launch, isMobile, position, realm, osName, arch])

  const closeDownloadModal = useCallback(() => setDownloadModalOpen(false), [])

  const downloadModalProps = useDownloadModalProps(deepLinkParams)

  return { launchExplorer, isMobile, isDownloadModalOpen, closeDownloadModal, downloadModalProps }
}

export { useLaunchExplorer }
export type { LaunchExplorerOptions }
