import { useCallback } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { buildDeepLinkOptions, buildMobileDeepLink } from '../features/places/places.helpers'
import { DOWNLOAD_URLS, detectDownloadOS } from '../modules/downloadConstants'
import { launchMobileApp } from '../utils/mobileAppLaunch'
import { useDeepLinkQueryParams } from './useDeepLinkQueryParams'

// What a launch attempt resolved to, so the caller can track + fall back:
//   'mobile-launched' → the phone left the page for the app (see `launchMobileApp`)
//   'mobile-store'    → the protocol didn't take, we sent the phone to the store
//   'launched'        → the desktop client opened the deep link
//   'not-installed'   → launchDesktopApp reported the client didn't take
//   'launch-error'    → the launch threw (blocked protocol handler, etc.)
type LaunchOutcome = 'mobile-launched' | 'mobile-store' | 'launched' | 'not-installed' | 'launch-error'

// The launch didn't take → prompt the download (shared by every caller so the
// decision lives in one place).
function shouldPromptDownload(outcome: LaunchOutcome): boolean {
  return outcome === 'not-installed' || outcome === 'launch-error'
}

// Only an explicit `not-installed` (launchDesktopApp returned false) is tracked
// as CLIENT_NOT_INSTALLED — a rejection isn't proof the client is absent, and
// the legacy flow never tracked it.
function isClientNotInstalled(outcome: LaunchOutcome): boolean {
  return outcome === 'not-installed'
}

/**
 * The device-aware "open the explorer" mechanics shared by every jump-in
 * surface (homepage `useLaunchExplorer`, discover jump-in): both tiers fire the
 * `decentraland://` protocol first, mobile through `launchMobileApp` and desktop
 * through `launchDesktopApp`. It emits NO analytics and owns no modal state —
 * it returns the outcome so each caller tracks its own event and renders its own
 * DownloadModal. The deep-link query params (see `useDeepLinkQueryParams`) are
 * threaded into the deep link, matching the standalone flow.
 */
function useExplorerLauncher() {
  const [, advancedUserAgent] = useAdvancedUserAgentData()
  const { dclenv, sceneConsole, multiInstance } = useDeepLinkQueryParams()

  const isMobile = Boolean(advancedUserAgent?.mobile)
  const downloadOs = detectDownloadOS()
  const osName = advancedUserAgent?.os?.name ?? 'unknown'
  const arch = advancedUserAgent?.cpu?.architecture?.toLowerCase() ?? 'unknown'

  const launch = useCallback(
    async (options: { position?: string; realm?: string }): Promise<LaunchOutcome> => {
      if (isMobile) {
        // NOTE: 2026-09-16 — this used to go straight to the store, which dropped
        // the target and sent an owner of the app to a download page. A phone gets
        // the same two-step as the desktop client now: fire the protocol, and fall
        // back only when it didn't take. The app registers `decentraland://` on
        // both platforms (iOS CFBundleURLSchemes, Android BROWSABLE intent-filter).
        const isAndroid = downloadOs === 'android'
        const storeUrl = isAndroid ? DOWNLOAD_URLS.googlePlay : DOWNLOAD_URLS.appStore
        const deepLink = buildMobileDeepLink({ position: options.position, realm: options.realm, dclenv })
        const launched = await launchMobileApp({ deepLink, storeUrl, isAndroid })
        if (launched) return 'mobile-launched'
        // The store URLs carry the campaign overlay and the Play install-referrer
        // (see `downloadConstants.buildGooglePlayUrl`), so the install stays
        // attributable exactly as it was before this change.
        window.open(storeUrl, '_self')
        return 'mobile-store'
      }
      try {
        const launched = await launchDesktopApp(
          buildDeepLinkOptions({
            position: options.position,
            realm: options.realm,
            dclenv,
            sceneConsole,
            multiInstance
          })
        )
        return launched ? 'launched' : 'not-installed'
      } catch {
        return 'launch-error'
      }
    },
    [isMobile, downloadOs, dclenv, sceneConsole, multiInstance]
  )

  return { launch, isMobile, osName, arch }
}

export { isClientNotInstalled, shouldPromptDownload, useExplorerLauncher }
export type { LaunchOutcome }
