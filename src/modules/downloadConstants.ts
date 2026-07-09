import { withCampaignParamsOverlay } from './campaignParams'

/**
 * Default Play Store campaign tag (the site's own "QR code" attribution),
 * used when the visitor didn't arrive via a live campaign. See
 * `DOWNLOAD_URLS.googlePlay` below.
 */
const GOOGLE_PLAY_DEFAULT_URL =
  'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&utm_org=dclrgl&utm_source=fdn&utm_medium=qr&utm_campaign=dclpage&utm_content=android'

/**
 * Centralized download URLs.
 * Mirrors decentraland-ui2/modules/downloadUrls but avoids deep imports
 * that break with module federation's shared scope.
 */
const DOWNLOAD_URLS = {
  windows: 'https://decentraland.org/download',
  apple: 'https://decentraland.org/download',
  epic: 'https://store.epicgames.com/en-US/p/decentraland-b692fb',
  // Getter (not a plain string) so it's computed fresh on every read: overlays
  // the visitor's incoming campaign params onto the default QR-code
  // attribution, so a click that arrived via a live campaign carries that
  // campaign into the Play Store handoff instead of always reporting
  // "fdn/qr/dclpage". Without this, no Play Store install can ever be
  // attributed to a dynamic campaign — the store link always shipped the same
  // static tag regardless of how the visitor actually landed.
  get googlePlay(): string {
    return withCampaignParamsOverlay(GOOGLE_PLAY_DEFAULT_URL)
  },
  appStore: 'https://apps.apple.com/app/apple-store/id6478403840?pt=126284288&ct=Decentraland%20Home%20iOS&mt=8'
} as const

type DownloadOS = 'apple' | 'windows' | 'android' | 'ios'

// eslint-disable-next-line @typescript-eslint/naming-convention
function detectDownloadOS(): DownloadOS {
  if (typeof navigator === 'undefined') return 'windows'
  const ua = navigator.userAgent.toLowerCase()
  if (/android/.test(ua)) return 'android'
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/mac/.test(ua)) return 'apple'
  return 'windows'
}

function getDownloadUrl(os: DownloadOS): string {
  switch (os) {
    case 'apple':
      return DOWNLOAD_URLS.apple
    case 'ios':
      return DOWNLOAD_URLS.appStore
    case 'android':
      return DOWNLOAD_URLS.googlePlay
    default:
      return DOWNLOAD_URLS.windows
  }
}

export { DOWNLOAD_URLS, detectDownloadOS, getDownloadUrl }
export type { DownloadOS }
