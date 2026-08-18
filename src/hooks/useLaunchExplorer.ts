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
 * Shared "open the explorer" behavior (JumpInButton, EditProfileButton): mobile goes to the
 * store, desktop deep-links via `launchDesktopApp`, and a missing client falls back to the
 * DownloadModal (the caller renders it). The modal's download URL carries the deep-link
 * (position/realm) plus the tracking params (campaign utm_*, anon_user_id) so attribution and
 * first-launch location survive the hop to `/download`.
 */
function useLaunchExplorer({ position, realm }: LaunchExplorerOptions) {
  const { track } = useAnalytics()
  const { launch, isMobile, osName, arch } = useExplorerLauncher()
  const [isDownloadModalOpen, setDownloadModalOpen] = useState(false)

  // Default-filtered deep-link params. Without the `env` arg this never emits
  // `dclenv`, and it drops `position: ''` (the manual `!== DEFAULT` check let
  // empty strings through as `?position=`).
  const deepLinkParams = useMemo(() => buildDeepLinkOptions({ position, realm }), [position, realm])

  const launchExplorer = useCallback(async () => {
    track(SegmentEvent.GO_TO_EXPLORER, { position, realm, osName, arch, ...(isMobile ? { target: 'mobile-store' } : {}) })

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
