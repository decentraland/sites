import { withCampaignParamsOverlay } from './campaignParams'

/**
 * Default Play Store campaign tag (the site's own "QR code" attribution),
 * used when the visitor didn't arrive via a live campaign. See
 * `DOWNLOAD_URLS.googlePlay` below.
 */
const GOOGLE_PLAY_DEFAULT_URL =
  'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&utm_org=dclrgl&utm_source=fdn&utm_medium=qr&utm_campaign=dclpage&utm_content=android'

/**
 * Builds the effective Play Store URL: incoming campaign params overlaid on
 * the default tag, plus a `referrer` param mirroring the final utm_* set.
 *
 * The bare utm_* params only tag the store-page visit (Play Console
 * acquisition reports). Campaign attribution for the INSTALL travels through
 * the Play Install Referrer API, which reads the `referrer` query param —
 * without it, no install can ever be joined back to a campaign, no matter
 * what the URL's utm_* say. The mobile client still has to read its install
 * referrer and forward it to analytics for the loop to close; this makes the
 * data available at the store handoff so that work is unblocked.
 */
function buildGooglePlayUrl(): string {
  const url = new URL(withCampaignParamsOverlay(GOOGLE_PLAY_DEFAULT_URL))
  const referrer = new URLSearchParams()
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith('utm_')) {
      referrer.append(key, value)
    }
  }
  // URLSearchParams.set percent-encodes the nested query string on
  // serialization (`utm_source%3D…%26utm_medium%3D…`), matching the format
  // the Install Referrer API expects.
  url.searchParams.set('referrer', referrer.toString())
  return url.toString()
}

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
  // static tag regardless of how the visitor actually landed. See
  // buildGooglePlayUrl for the `referrer` install-attribution mirror.
  get googlePlay(): string {
    return buildGooglePlayUrl()
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
