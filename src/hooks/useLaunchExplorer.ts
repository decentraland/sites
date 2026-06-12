import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdvancedUserAgentData, useAnalytics } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { mapEnvToDclenv } from '../config/dclenv'
import { getEnv } from '../config/env'
import { buildDeepLinkOptions } from '../features/places/places.helpers'
import { DOWNLOAD_URLS, detectDownloadOS } from '../modules/downloadConstants'
import { SegmentEvent } from '../modules/segment'
import { useAuthIdentity } from './useAuthIdentity'

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
 * download flow (direct download / onboarding / DownloadModal — the caller renders the modal).
 */
function useLaunchExplorer({ position, realm }: LaunchExplorerOptions) {
  const [searchParams] = useSearchParams()
  const [, advancedUserAgent] = useAdvancedUserAgentData()
  const { track } = useAnalytics()
  const { hasValidIdentity } = useAuthIdentity()
  const [isDownloadModalOpen, setDownloadModalOpen] = useState(false)

  const explorerEnv = searchParams.get('dclenv') ?? mapEnvToDclenv(searchParams.get('env'))

  const onboardingUrl = getEnv('ONBOARDING_URL') ?? ''
  const downloadUrl = getEnv('DOWNLOAD_URL') ?? DOWNLOAD_URLS.windows
  const osName = advancedUserAgent?.os?.name ?? 'unknown'
  const arch = advancedUserAgent?.cpu?.architecture?.toLowerCase() ?? 'unknown'
  const isMobile = Boolean(advancedUserAgent?.mobile)
  const downloadOs = detectDownloadOS()

  const openDownloadFallback = useCallback(() => {
    if (hasValidIdentity) {
      window.open(downloadUrl, '_self')
      return
    }
    if (onboardingUrl) {
      window.open(onboardingUrl, '_self')
    } else {
      setDownloadModalOpen(true)
    }
  }, [hasValidIdentity, downloadUrl, onboardingUrl])

  const launchExplorer = useCallback(async () => {
    if (isMobile) {
      const storeUrl = downloadOs === 'android' ? DOWNLOAD_URLS.googlePlay : DOWNLOAD_URLS.appStore
      track(SegmentEvent.GO_TO_EXPLORER, { position, realm, osName, arch, target: 'mobile-store' })
      window.open(storeUrl, '_self')
      return
    }

    track(SegmentEvent.GO_TO_EXPLORER, { position, realm, osName, arch })

    try {
      const launched = await launchDesktopApp(buildDeepLinkOptions(position, realm, explorerEnv))
      if (!launched) {
        track(SegmentEvent.CLICK, { event: SegmentEvent.CLIENT_NOT_INSTALLED, os: osName, arch })
        openDownloadFallback()
      }
    } catch {
      openDownloadFallback()
    }
  }, [isMobile, downloadOs, track, position, realm, explorerEnv, osName, arch, openDownloadFallback])

  const closeDownloadModal = useCallback(() => setDownloadModalOpen(false), [])

  const downloadModalProps: DownloadModalProps = {
    os: downloadOs,
    downloadUrl: downloadOs === 'apple' ? DOWNLOAD_URLS.apple : DOWNLOAD_URLS.windows,
    epicUrl: DOWNLOAD_URLS.epic,
    googlePlayUrl: DOWNLOAD_URLS.googlePlay,
    appStoreUrl: DOWNLOAD_URLS.appStore
  }

  return { launchExplorer, isMobile, isDownloadModalOpen, closeDownloadModal, downloadModalProps }
}

export { useLaunchExplorer }
export type { LaunchExplorerOptions }
