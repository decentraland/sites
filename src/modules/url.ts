import { config } from 'decentraland-ui2/dist/config'
import { CDNSource, getCDNRelease } from 'decentraland-ui2/dist/modules/cdnReleases'
import { Architecture } from '../types/download.types'

const addQueryParamsToUrlString = (url: string, params: Record<string, string | undefined | null>): string => {
  if (!params || Object.keys(params).length === 0) {
    return url
  }

  const urlObj = new URL(url)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlObj.searchParams.append(key, value)
    }
  })

  return urlObj.toString()
}

const updateUrlWithLastValue = (url: string, paramKey: string, paramValue: string) => {
  const urlObj = new URL(url)

  urlObj.searchParams.delete(paramKey)
  urlObj.searchParams.append(paramKey, paramValue)

  return urlObj.toString()
}

const sanitizeCDNReleaseLinks = (
  cdnLinks: Record<string, Record<string, string | undefined>> | null
): Record<string, Record<string, string>> | null => {
  if (!cdnLinks) return null

  const sanitizedLinks: Record<string, Record<string, string>> = {}
  for (const [os, archLinks] of Object.entries(cdnLinks)) {
    const sanitizedArchLinks: Record<string, string> = {}
    for (const [arch, link] of Object.entries(archLinks)) {
      if (link) {
        sanitizedArchLinks[arch] = link
      }
    }
    if (Object.keys(sanitizedArchLinks).length > 0) {
      sanitizedLinks[os] = sanitizedArchLinks
    }
  }
  return Object.keys(sanitizedLinks).length > 0 ? sanitizedLinks : null
}

/**
 * Builds the gateway URL map for the anonymous Download First flow.
 *
 * The gateway exposes `/anonymous/decentraland.<ext>?anon_user_id=<UUID>` for
 * users who haven't authenticated yet. The wrapper installer embeds the
 * `anon_user_id` so the launcher can read it after install and propagate it
 * to the Explorer for cross-funnel attribution.
 *
 * Without an `anonUserId`, fall back to the static CDN map — there's no
 * value in pegging the gateway when we can't attribute the install.
 */
const buildAnonymousGatewayLinks = (anonUserId: string): Record<string, Record<string, string>> | null => {
  const baseUrl = config.get('AUTO_SIGNING_BASE_URL')
  if (!baseUrl) return null

  const buildUrl = (ext: 'exe' | 'dmg') => `${baseUrl}/anonymous/decentraland.${ext}?anon_user_id=${encodeURIComponent(anonUserId)}`

  // Mirror the OS/arch shape produced by getCDNRelease for downstream consumers.
  // The keys here intentionally use the same casing (`Windows`, `macOS`) that
  // decentraland-ui2's getCDNRelease emits, which is what the consumer code
  // (extractFallbackLink, extractDownloadLinkFromCDNReleaseOption) keys against.
  /* eslint-disable @typescript-eslint/naming-convention */
  return {
    Windows: { amd64: buildUrl('exe') },
    macOS: { arm64: buildUrl('dmg'), amd64: buildUrl('dmg') }
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}

const calculateCDNReleaseLinksWithIdentity = async (
  getIdentityId?: () => Promise<string | undefined>,
  fallbackLinks?: Record<string, Record<string, string>> | null,
  anonUserId?: string
): Promise<Record<string, Record<string, string>> | null> => {
  if (!getIdentityId) {
    if (anonUserId) {
      const anonLinks = buildAnonymousGatewayLinks(anonUserId)
      if (anonLinks) return anonLinks
    }
    const launcherLinks = getCDNRelease(CDNSource.LAUNCHER)
    return fallbackLinks || sanitizeCDNReleaseLinks(launcherLinks)
  }

  try {
    const currentIdentityId = await getIdentityId()
    if (currentIdentityId) {
      const cdnLinks = getCDNRelease(CDNSource.AUTO_SIGNING, currentIdentityId)
      return sanitizeCDNReleaseLinks(cdnLinks) || fallbackLinks || null
    }

    // No identity but we DO have an anon_user_id → use the anonymous gateway
    // route so the installer carries the campaign id end-to-end.
    if (anonUserId) {
      const anonLinks = buildAnonymousGatewayLinks(anonUserId)
      if (anonLinks) return anonLinks
    }

    const launcherLinks = getCDNRelease(CDNSource.LAUNCHER)
    return sanitizeCDNReleaseLinks(launcherLinks) || fallbackLinks || null
  } catch (error) {
    console.error('Failed to generate identityId:', error)
    if (anonUserId) {
      const anonLinks = buildAnonymousGatewayLinks(anonUserId)
      if (anonLinks) return anonLinks
    }
    const launcherLinks = getCDNRelease(CDNSource.LAUNCHER)
    return sanitizeCDNReleaseLinks(launcherLinks) || fallbackLinks || null
  }
}

const extractDownloadLinkFromCDNReleaseOption = (
  optionText: string,
  optionArch: Architecture | undefined,
  optionFallbackLink: string | undefined,
  cdnReleaseLinks: Record<string, Record<string, string>> | null
): string | undefined => {
  if (!cdnReleaseLinks?.[optionText]) return optionFallbackLink

  const osLinks = cdnReleaseLinks[optionText]
  if (optionArch && osLinks[optionArch]) {
    return osLinks[optionArch]
  }

  const firstAvailableLink = Object.values(osLinks)[0]
  return firstAvailableLink || optionFallbackLink
}

const FALLBACK_CDN_RELEASE_LINKS = sanitizeCDNReleaseLinks(getCDNRelease(CDNSource.LAUNCHER)) || {}

export {
  FALLBACK_CDN_RELEASE_LINKS,
  addQueryParamsToUrlString,
  calculateCDNReleaseLinksWithIdentity,
  extractDownloadLinkFromCDNReleaseOption,
  sanitizeCDNReleaseLinks,
  updateUrlWithLastValue
}
