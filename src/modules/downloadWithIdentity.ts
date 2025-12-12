import { triggerFileDownload } from './file'
import { addQueryParamsToUrlString, calculateCDNReleaseLinksWithIdentity, extractDownloadLinkFromCDNReleaseOption } from './url'
import { Architecture } from '../components/Landing/DownloadOptions/DownloadOptions.types'

type DownloadWithIdentityParams = {
  os: string
  arch: Architecture | undefined
  fallbackLinks?: Record<string, Record<string, string>> | null
  queryParams?: Record<string, string | undefined | null>
  getIdentityId?: () => Promise<string | undefined>
}

/**
 * Extracts a fallback link from fallbackLinks based on os and arch
 */
function extractFallbackLink(
  os: string,
  arch: Architecture | undefined,
  fallbackLinks: Record<string, Record<string, string>> | null | undefined
): string | undefined {
  if (!fallbackLinks?.[os]) return undefined

  const osLinks = fallbackLinks[os]
  if (arch && osLinks[arch]) {
    return osLinks[arch]
  }

  if (os === 'macOS' && osLinks['arm64']) {
    return osLinks['arm64']
  }

  return Object.values(osLinks)[0]
}

/**
 * Extracts filename from a URL
 */
function extractFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const urlParts = pathname.split('/')
    const filename = urlParts[urlParts.length - 1]

    if (filename && filename.includes('.')) {
      return filename
    }

    return 'launcher'
  } catch {
    const urlParts = url.split('/')
    const filename = urlParts[urlParts.length - 1]
    return filename && filename.includes('.') ? filename : 'launcher'
  }
}

/**
 * Calculates the download URL with identity-based CDN link calculation
 * @param params - Parameters for the download operation
 * @returns The download URL and filename, or throws an error if no link is available
 */
async function calculateDownloadUrl(params: DownloadWithIdentityParams): Promise<{ url: string; filename: string }> {
  const { os, arch, fallbackLinks, getIdentityId } = params

  const fallbackLink = extractFallbackLink(os, arch, fallbackLinks)

  const currentLinks = await calculateCDNReleaseLinksWithIdentity(getIdentityId, fallbackLinks || null)

  const downloadLink = extractDownloadLinkFromCDNReleaseOption(os, arch, fallbackLink, currentLinks)

  if (!downloadLink) {
    throw new Error('No download link available')
  }

  const filename = extractFilenameFromUrl(downloadLink)

  return {
    url: downloadLink,
    filename
  }
}

/**
 * Handles download with identity-based CDN link calculation
 * @param params - Parameters for the download operation
 * @returns The download link that was used, or undefined if no link was available
 */
async function downloadWithIdentity(params: DownloadWithIdentityParams): Promise<string | undefined> {
  const { os, arch, fallbackLinks, queryParams, getIdentityId } = params

  const fallbackLink = extractFallbackLink(os, arch, fallbackLinks)

  const currentLinks = await calculateCDNReleaseLinksWithIdentity(getIdentityId, fallbackLinks || null)

  const downloadLink = extractDownloadLinkFromCDNReleaseOption(os, arch, fallbackLink, currentLinks)

  if (!downloadLink) {
    return undefined
  }

  const finalLink = queryParams ? addQueryParamsToUrlString(downloadLink, queryParams) : downloadLink

  triggerFileDownload(finalLink)
  return finalLink
}

export { calculateDownloadUrl, downloadWithIdentity }
export type { DownloadWithIdentityParams }
