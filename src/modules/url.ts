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

const calculateCDNReleaseLinksWithIdentity = async (
  getIdentityId?: () => Promise<string | undefined>,
  fallbackLinks?: Record<string, Record<string, string>> | null
): Promise<Record<string, Record<string, string>> | null> => {
  if (!getIdentityId) {
    const launcherLinks = getCDNRelease(CDNSource.LAUNCHER)
    return fallbackLinks || sanitizeCDNReleaseLinks(launcherLinks)
  }

  try {
    const currentIdentityId = await getIdentityId()
    const cdnLinks = currentIdentityId ? getCDNRelease(CDNSource.AUTO_SIGNING, currentIdentityId) : getCDNRelease(CDNSource.LAUNCHER)

    return sanitizeCDNReleaseLinks(cdnLinks) || fallbackLinks || null
  } catch (error) {
    console.error('Failed to generate identityId:', error)
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
