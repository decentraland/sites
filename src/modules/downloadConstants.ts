import publicLinks from '../config/publicLinks.json'
import { collectCampaignParams } from './campaignParams'
import { buildGooglePlayUrl } from './googlePlayUrl'

/**
 * Default Play Store campaign tag (the site's own "QR code" attribution), used when the visitor
 * didn't arrive via a live campaign. The base URL in publicLinks.json carries no utm_* on purpose:
 * llms.txt builds its own attribution on the same base.
 */
/* eslint-disable @typescript-eslint/naming-convention -- utm_* are the query param names on the wire */
const GOOGLE_PLAY_DEFAULT_UTM = {
  utm_org: 'dclrgl',
  utm_source: 'fdn',
  utm_medium: 'qr',
  utm_campaign: 'dclpage',
  utm_content: 'android'
}
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Centralized download URLs.
 * Mirrors decentraland-ui2/modules/downloadUrls but avoids deep imports
 * that break with module federation's shared scope.
 */
const DOWNLOAD_URLS = {
  windows: publicLinks.download.desktop,
  apple: publicLinks.download.desktop,
  epic: publicLinks.download.epic,
  // Getter (not a plain string) so it's computed fresh on every read: overlays
  // the visitor's incoming campaign params onto the default QR-code
  // attribution, so a click that arrived via a live campaign carries that
  // campaign into the Play Store handoff instead of always reporting
  // "fdn/qr/dclpage". Without this, no Play Store install can ever be
  // attributed to a dynamic campaign — the store link always shipped the same
  // static tag regardless of how the visitor actually landed. See
  // buildGooglePlayUrl for the `referrer` install-attribution mirror.
  get googlePlay(): string {
    return buildGooglePlayUrl(publicLinks.download.googlePlay, { ...GOOGLE_PLAY_DEFAULT_UTM, ...collectCampaignParams() })
  },
  appStore: publicLinks.download.appStore
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
