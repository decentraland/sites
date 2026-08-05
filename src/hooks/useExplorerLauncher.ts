import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { mapEnvToDclenv } from '../config/dclenv'
import { buildDeepLinkOptions } from '../features/places/places.helpers'
import { DOWNLOAD_URLS, detectDownloadOS } from '../modules/downloadConstants'

// What a launch attempt resolved to, so the caller can track + fall back:
//   'mobile-store'  → sent to the app store (no desktop client on touch devices)
//   'launched'      → the desktop client opened the deep link
//   'not-installed' → launchDesktopApp reported the client didn't take
//   'launch-error'  → the launch threw (blocked protocol handler, etc.)
// Both 'not-installed' and 'launch-error' should prompt the download, but only
// 'not-installed' emits CLIENT_NOT_INSTALLED — a rejection isn't proof the
// client is absent, and the legacy flow never tracked it.
type LaunchOutcome = 'mobile-store' | 'launched' | 'not-installed' | 'launch-error'

/**
 * The device-aware "open the explorer" mechanics shared by every jump-in
 * surface (homepage `useLaunchExplorer`, discover jump-in): mobile → app store,
 * desktop → `launchDesktopApp`. It emits NO analytics and owns no modal state —
 * it returns the outcome so each caller tracks its own event and renders its own
 * DownloadModal. The `?env`/`?dclenv`/`?scene-console` query params are threaded
 * into the deep link, matching the standalone flow.
 */
function useExplorerLauncher() {
  const [searchParams] = useSearchParams()
  const [, advancedUserAgent] = useAdvancedUserAgentData()

  const isMobile = Boolean(advancedUserAgent?.mobile)
  const downloadOs = detectDownloadOS()
  const osName = advancedUserAgent?.os?.name ?? 'unknown'
  const arch = advancedUserAgent?.cpu?.architecture?.toLowerCase() ?? 'unknown'
  const explorerEnv = searchParams.get('dclenv') ?? mapEnvToDclenv(searchParams.get('env'))
  const sceneConsole = searchParams.get('scene-console') ?? undefined

  const launch = useCallback(
    async (options: { position?: string; realm?: string }): Promise<LaunchOutcome> => {
      if (isMobile) {
        const storeUrl = downloadOs === 'android' ? DOWNLOAD_URLS.googlePlay : DOWNLOAD_URLS.appStore
        window.open(storeUrl, '_self')
        return 'mobile-store'
      }
      try {
        const launched = await launchDesktopApp(buildDeepLinkOptions(options.position, options.realm, explorerEnv, sceneConsole))
        return launched ? 'launched' : 'not-installed'
      } catch {
        return 'launch-error'
      }
    },
    [isMobile, downloadOs, explorerEnv, sceneConsole]
  )

  return { launch, isMobile, downloadOs, osName, arch }
}

export { useExplorerLauncher }
export type { LaunchOutcome }
