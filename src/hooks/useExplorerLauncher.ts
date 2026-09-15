import { useCallback } from 'react'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { buildDeepLinkOptions, buildMobileAppLink } from '../features/places/places.helpers'
import { collectCampaignParams } from '../modules/campaignParams'
import { useDeepLinkQueryParams } from './useDeepLinkQueryParams'

// What a launch attempt resolved to, so the caller can track + fall back:
//   'mobile-app-link' → handed to the mobile explorer's app link (no desktop client on touch devices)
//   'launched'        → the desktop client opened the deep link
//   'not-installed'   → launchDesktopApp reported the client didn't take
//   'launch-error'    → the launch threw (blocked protocol handler, etc.)
type LaunchOutcome = 'mobile-app-link' | 'launched' | 'not-installed' | 'launch-error'

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
 * surface (homepage `useLaunchExplorer`, discover jump-in): mobile → the app
 * link, desktop → `launchDesktopApp`. It emits NO analytics and owns no modal state —
 * it returns the outcome so each caller tracks its own event and renders its own
 * DownloadModal. The deep-link query params (see `useDeepLinkQueryParams`) are
 * threaded into the deep link, matching the standalone flow.
 */
function useExplorerLauncher() {
  const [, advancedUserAgent] = useAdvancedUserAgentData()
  const { dclenv, sceneConsole, multiInstance } = useDeepLinkQueryParams()

  const isMobile = Boolean(advancedUserAgent?.mobile)
  const osName = advancedUserAgent?.os?.name ?? 'unknown'
  const arch = advancedUserAgent?.cpu?.architecture?.toLowerCase() ?? 'unknown'

  const launch = useCallback(
    async (options: { position?: string; realm?: string }): Promise<LaunchOutcome> => {
      if (isMobile) {
        // NOTE: 2026-09-15 — this used to go straight to the store, which dropped
        // the target and sent an owner of the app to a download page. The mobile
        // explorer registers `mobile.dclexplorer.com/open` on both platforms, so
        // the same tap now teleports an installed app and still lands on a page
        // with both store links when there is nothing to open.
        //
        // Attribution cost of that hop: the store URLs we no longer build carried
        // the campaign overlay and the Play install-referrer (see
        // `downloadConstants.buildGooglePlayUrl`), and the landing page's own
        // store links are untagged. The campaign params travel on the app link so
        // that page can forward them once its owners wire it up; until then a
        // jump-in install on a device without the app is unattributed.
        window.open(buildMobileAppLink({ position: options.position, realm: options.realm, dclenv }, collectCampaignParams()), '_self')
        return 'mobile-app-link'
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
    [isMobile, dclenv, sceneConsole, multiInstance]
  )

  return { launch, isMobile, osName, arch }
}

export { isClientNotInstalled, shouldPromptDownload, useExplorerLauncher }
export type { LaunchOutcome }
