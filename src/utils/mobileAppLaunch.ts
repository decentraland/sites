// The mobile half of "open the explorer", mirroring what `launchDesktopApp`
// (decentraland-ui2) does on desktop: fire the `decentraland://` protocol and
// watch for the page losing focus, because the browser never tells us whether a
// custom scheme was handled. The caller falls back to the store when it wasn't.
//
// Android goes through `intent://` instead of the bare scheme: Chrome resolves
// it against the installed package and, when nothing handles it, navigates to
// `browser_fallback_url` itself, so a device without the app never sees the
// ERR_UNKNOWN_URL_SCHEME error page.

/** Play Store id of the mobile explorer (`export_presets.cfg` → `package/unique_name`). */
const ANDROID_PACKAGE = 'org.decentraland.godotexplorer'

// Desktop waits 750ms. A phone has to switch apps before the page reports
// hidden, so the same check needs more room; below ~1s a real launch starts
// resolving as "not installed" and the user gets bounced to the store.
const LAUNCH_TIMEOUT_MS = 1500

interface MobileLaunchOptions {
  /** `decentraland://open?...` deep link the installed app answers. */
  deepLink: string
  /** Where Chrome sends an Android device with no app. Also the caller's own fallback. */
  storeUrl: string
  isAndroid: boolean
  timeoutMs?: number
}

/**
 * Rewrites a `decentraland://open?x` deep link as the `intent://open?x#Intent;…`
 * form Chrome for Android understands, carrying the store URL as the fallback it
 * opens when the package isn't installed.
 */
function buildAndroidIntentUrl(deepLink: string, storeUrl: string): string {
  const target = deepLink.replace(/^decentraland:\/\//, '')
  const parts = ['scheme=decentraland', `package=${ANDROID_PACKAGE}`, `S.browser_fallback_url=${encodeURIComponent(storeUrl)}`]
  return `intent://${target}#Intent;${parts.join(';')};end`
}

/**
 * Attempts the protocol launch and resolves `true` when the page lost focus
 * within the timeout, which is the only signal a browser gives that something
 * took the navigation.
 *
 * On Android that `true` covers one extra case: Chrome may have followed
 * `browser_fallback_url` to the store on its own. Both leave the page, both need
 * nothing further from the caller.
 *
 * IMPORTANT: call inside a user gesture (onClick), or the navigation is blocked.
 */
function launchMobileApp({ deepLink, storeUrl, isAndroid, timeoutMs = LAUNCH_TIMEOUT_MS }: MobileLaunchOptions): Promise<boolean> {
  let leftPage = false

  const onLeave = () => {
    leftPage = true
  }
  const onVisibilityChange = () => {
    if (document.hidden) onLeave()
  }

  document.addEventListener('visibilitychange', onVisibilityChange, { passive: true })
  window.addEventListener('pagehide', onLeave, { passive: true })
  window.addEventListener('blur', onLeave, { passive: true })

  const cleanup = () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', onLeave)
    window.removeEventListener('blur', onLeave)
  }

  try {
    window.open(isAndroid ? buildAndroidIntentUrl(deepLink, storeUrl) : deepLink, '_self')
  } catch {
    // A blocked or unknown scheme can throw synchronously; treat it as "didn't
    // take" so the caller sends the user to the store.
    cleanup()
    return Promise.resolve(false)
  }

  return new Promise<boolean>(resolve => {
    setTimeout(() => {
      cleanup()
      resolve(leftPage)
    }, timeoutMs)
  })
}

export { LAUNCH_TIMEOUT_MS, buildAndroidIntentUrl, launchMobileApp }
export type { MobileLaunchOptions }
