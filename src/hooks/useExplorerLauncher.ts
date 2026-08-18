import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAdvancedUserAgentData } from '@dcl/hooks'
import { launchDesktopApp } from 'decentraland-ui2'
import { mapEnvToDclenv } from '../config/dclenv'
import { buildDeepLinkOptions } from '../features/places/places.helpers'
import { buildMobileDeepLinkUrl } from '../modules/downloadConstants'

// What a launch attempt resolved to, so the caller can track + fall back:
//   'mobile-deep-link' → sent to the mobile universal-link handler (opens the
//                        installed app; the handler page owns the store fallback)
//   'launched'         → the desktop client opened the deep link
//   'not-installed'    → launchDesktopApp reported the client didn't take
//   'launch-error'     → the launch threw (blocked protocol handler, etc.)
type LaunchOutcome = 'mobile-deep-link' | 'launched' | 'not-installed' | 'launch-error'

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
 * surface (homepage `useLaunchExplorer`, discover jump-in): mobile → the
 * universal-link handler that opens the installed app (or offers the store),
 * desktop → `launchDesktopApp`. It emits NO analytics and owns no modal state —
 * it returns the outcome so each caller tracks its own event and renders its own
 * DownloadModal. The `?env`/`?dclenv`/`?scene-console` query params are threaded
 * into the deep link, matching the standalone flow.
 */
function useExplorerLauncher() {
  const [searchParams] = useSearchParams()
  const [, advancedUserAgent] = useAdvancedUserAgentData()

  const isMobile = Boolean(advancedUserAgent?.mobile)
  const osName = advancedUserAgent?.os?.name ?? 'unknown'
  const arch = advancedUserAgent?.cpu?.architecture?.toLowerCase() ?? 'unknown'
  const explorerEnv = searchParams.get('dclenv') ?? mapEnvToDclenv(searchParams.get('env'))
  const sceneConsole = searchParams.get('scene-console') ?? undefined

  const launch = useCallback(
    async (options: { position?: string; realm?: string }): Promise<LaunchOutcome> => {
      if (isMobile) {
        // NOTE: 2026-08-18 — this used to send every mobile tap straight to the
        // app store, which on devices with a TestFlight build bounced into
        // TestFlight instead of the installed app. The universal link opens the
        // app at the destination; its handler page owns the store fallback.
        // The `?env`/`scene-console` overrides are desktop-only: the mobile
        // handler recognizes just position/realm, so they are not threaded here.
        const { position, realm } = buildDeepLinkOptions(options.position, options.realm)
        window.open(buildMobileDeepLinkUrl({ position, realm }), '_self')
        return 'mobile-deep-link'
      }
      try {
        const launched = await launchDesktopApp(buildDeepLinkOptions(options.position, options.realm, explorerEnv, sceneConsole))
        return launched ? 'launched' : 'not-installed'
      } catch {
        return 'launch-error'
      }
    },
    [isMobile, explorerEnv, sceneConsole]
  )

  return { launch, isMobile, osName, arch }
}

export { isClientNotInstalled, shouldPromptDownload, useExplorerLauncher }
export type { LaunchOutcome }
