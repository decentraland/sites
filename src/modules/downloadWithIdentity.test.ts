/* eslint-disable @typescript-eslint/naming-convention, import/order */
import type { Architecture } from '../types/download.types'

const mockCalculateCDNReleaseLinksWithIdentity = jest.fn()
const mockExtractDownloadLinkFromCDNReleaseOption = jest.fn()
const mockAddQueryParamsToUrlString = jest.fn()
const mockTriggerFileDownload = jest.fn()

jest.mock('./url', () => ({
  calculateCDNReleaseLinksWithIdentity: (...args: unknown[]) => mockCalculateCDNReleaseLinksWithIdentity(...args),
  extractDownloadLinkFromCDNReleaseOption: (...args: unknown[]) => mockExtractDownloadLinkFromCDNReleaseOption(...args),
  addQueryParamsToUrlString: (...args: unknown[]) => mockAddQueryParamsToUrlString(...args)
}))

jest.mock('./file', () => ({
  triggerFileDownload: (...args: unknown[]) => mockTriggerFileDownload(...args)
}))

import { calculateDownloadUrl, getDownloadLinkWithIdentity } from './downloadWithIdentity'

describe('calculateDownloadUrl', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when CDN returns a valid link', () => {
    let result: { url: string; filename: string }

    beforeEach(async () => {
      mockCalculateCDNReleaseLinksWithIdentity.mockResolvedValue({
        Windows: { amd64: 'https://cdn.example.com/launcher-1.2.3.exe' }
      })
      mockExtractDownloadLinkFromCDNReleaseOption.mockReturnValue('https://cdn.example.com/launcher-1.2.3.exe')
      result = await calculateDownloadUrl({
        os: 'Windows',
        arch: 'amd64' as Architecture,
        fallbackLinks: {
          Windows: { amd64: 'https://fallback.example.com/launcher.exe' }
        },
        getIdentityId: async () => 'test-identity'
      })
    })

    it('should return the CDN URL', () => {
      expect(result.url).toBe('https://cdn.example.com/launcher-1.2.3.exe')
    })

    it('should extract the filename from the URL', () => {
      expect(result.filename).toBe('launcher-1.2.3.exe')
    })
  })

  describe('when CDN returns null and fallback is used', () => {
    let result: { url: string; filename: string }

    beforeEach(async () => {
      mockCalculateCDNReleaseLinksWithIdentity.mockResolvedValue(null)
      mockExtractDownloadLinkFromCDNReleaseOption.mockReturnValue('https://fallback.example.com/launcher-setup.exe')
      result = await calculateDownloadUrl({
        os: 'Windows',
        arch: 'amd64' as Architecture,
        fallbackLinks: {
          Windows: { amd64: 'https://fallback.example.com/launcher-setup.exe' }
        }
      })
    })

    it('should return the fallback URL', () => {
      expect(result.url).toBe('https://fallback.example.com/launcher-setup.exe')
    })

    it('should extract the filename from the fallback URL', () => {
      expect(result.filename).toBe('launcher-setup.exe')
    })

    it('should pass the fallback links to calculateCDNReleaseLinksWithIdentity', () => {
      expect(mockCalculateCDNReleaseLinksWithIdentity).toHaveBeenCalledWith(undefined, {
        Windows: { amd64: 'https://fallback.example.com/launcher-setup.exe' }
      })
    })
  })

  describe('when no download link is available', () => {
    beforeEach(() => {
      mockCalculateCDNReleaseLinksWithIdentity.mockResolvedValue(null)
      mockExtractDownloadLinkFromCDNReleaseOption.mockReturnValue(undefined)
    })

    it('should throw an error', async () => {
      await expect(
        calculateDownloadUrl({
          os: 'Linux',
          arch: 'amd64' as Architecture
        })
      ).rejects.toThrow('No download link available')
    })
  })

  describe('when the URL has no file extension', () => {
    let result: { url: string; filename: string }

    beforeEach(async () => {
      mockCalculateCDNReleaseLinksWithIdentity.mockResolvedValue(null)
      mockExtractDownloadLinkFromCDNReleaseOption.mockReturnValue('https://cdn.example.com/download')
      result = await calculateDownloadUrl({
        os: 'Windows',
        arch: 'amd64' as Architecture
      })
    })

    it('should default the filename to launcher', () => {
      expect(result.filename).toBe('launcher')
    })
  })

  describe('when fallbackLinks is undefined', () => {
    beforeEach(async () => {
      mockCalculateCDNReleaseLinksWithIdentity.mockResolvedValue(null)
      mockExtractDownloadLinkFromCDNReleaseOption.mockReturnValue('https://cdn.example.com/launcher.exe')
      await calculateDownloadUrl({
        os: 'Windows',
        arch: 'amd64' as Architecture
      })
    })

    it('should pass null as fallbackLinks to calculateCDNReleaseLinksWithIdentity', () => {
      expect(mockCalculateCDNReleaseLinksWithIdentity).toHaveBeenCalledWith(undefined, null)
    })
  })
})

describe('getDownloadLinkWithIdentity', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when a download link is available', () => {
    let result: string | undefined

    beforeEach(async () => {
      mockCalculateCDNReleaseLinksWithIdentity.mockResolvedValue({
        Windows: { amd64: 'https://cdn.example.com/launcher.exe' }
      })
      mockExtractDownloadLinkFromCDNReleaseOption.mockReturnValue('https://cdn.example.com/launcher.exe')
      mockAddQueryParamsToUrlString.mockReturnValue('https://cdn.example.com/launcher.exe?anon_user_id=abc-123')
      result = await getDownloadLinkWithIdentity({
        os: 'Windows',
        arch: 'amd64' as Architecture,
        queryParams: { anon_user_id: 'abc-123' }
      })
    })

    it('should call triggerFileDownload with the final URL', () => {
      expect(mockTriggerFileDownload).toHaveBeenCalledWith('https://cdn.example.com/launcher.exe?anon_user_id=abc-123')
    })

    it('should return the final URL with query params', () => {
      expect(result).toBe('https://cdn.example.com/launcher.exe?anon_user_id=abc-123')
    })

    it('should call addQueryParamsToUrlString with the download link and params', () => {
      expect(mockAddQueryParamsToUrlString).toHaveBeenCalledWith('https://cdn.example.com/launcher.exe', { anon_user_id: 'abc-123' })
    })
  })

  describe('when queryParams include anon_user_id and source', () => {
    let result: string | undefined

    beforeEach(async () => {
      mockCalculateCDNReleaseLinksWithIdentity.mockResolvedValue(null)
      mockExtractDownloadLinkFromCDNReleaseOption.mockReturnValue('https://fallback.example.com/launcher.exe')
      mockAddQueryParamsToUrlString.mockReturnValue('https://fallback.example.com/launcher.exe?anon_user_id=user-456&source=landing')
      result = await getDownloadLinkWithIdentity({
        os: 'Windows',
        arch: 'amd64' as Architecture,
        queryParams: { anon_user_id: 'user-456', source: 'landing' }
      })
    })

    it('should pass all query params to addQueryParamsToUrlString', () => {
      expect(mockAddQueryParamsToUrlString).toHaveBeenCalledWith('https://fallback.example.com/launcher.exe', {
        anon_user_id: 'user-456',
        source: 'landing'
      })
    })

    it('should return the URL with all params appended', () => {
      expect(result).toBe('https://fallback.example.com/launcher.exe?anon_user_id=user-456&source=landing')
    })
  })

  describe('when the CDN link includes an identityId in the path', () => {
    let result: string | undefined

    beforeEach(async () => {
      const cdnUrl = 'https://cdn.example.com/identity-abc/launcher-1.0.0.exe'
      mockCalculateCDNReleaseLinksWithIdentity.mockResolvedValue({
        Windows: { amd64: cdnUrl }
      })
      mockExtractDownloadLinkFromCDNReleaseOption.mockReturnValue(cdnUrl)
      mockAddQueryParamsToUrlString.mockReturnValue(cdnUrl + '?anon_user_id=user-789')
      result = await getDownloadLinkWithIdentity({
        os: 'Windows',
        arch: 'amd64' as Architecture,
        queryParams: { anon_user_id: 'user-789' },
        getIdentityId: async () => 'identity-abc'
      })
    })

    it('should call triggerFileDownload with the identity-based CDN URL', () => {
      expect(mockTriggerFileDownload).toHaveBeenCalledWith('https://cdn.example.com/identity-abc/launcher-1.0.0.exe?anon_user_id=user-789')
    })

    it('should return the identity-based CDN URL with query params', () => {
      expect(result).toBe('https://cdn.example.com/identity-abc/launcher-1.0.0.exe?anon_user_id=user-789')
    })
  })

  describe('when queryParams is undefined', () => {
    let result: string | undefined

    beforeEach(async () => {
      mockCalculateCDNReleaseLinksWithIdentity.mockResolvedValue(null)
      mockExtractDownloadLinkFromCDNReleaseOption.mockReturnValue('https://fallback.example.com/launcher.dmg')
      result = await getDownloadLinkWithIdentity({
        os: 'macOS',
        arch: 'arm64' as Architecture,
        fallbackLinks: {
          macOS: { arm64: 'https://fallback.example.com/launcher.dmg' }
        }
      })
    })

    it('should not call addQueryParamsToUrlString', () => {
      expect(mockAddQueryParamsToUrlString).not.toHaveBeenCalled()
    })

    it('should call triggerFileDownload with the raw download link', () => {
      expect(mockTriggerFileDownload).toHaveBeenCalledWith('https://fallback.example.com/launcher.dmg')
    })

    it('should return the raw download link', () => {
      expect(result).toBe('https://fallback.example.com/launcher.dmg')
    })
  })

  describe('when no download link is available', () => {
    let result: string | undefined

    beforeEach(async () => {
      mockCalculateCDNReleaseLinksWithIdentity.mockResolvedValue(null)
      mockExtractDownloadLinkFromCDNReleaseOption.mockReturnValue(undefined)
      result = await getDownloadLinkWithIdentity({
        os: 'Linux',
        arch: 'amd64' as Architecture
      })
    })

    it('should not call triggerFileDownload', () => {
      expect(mockTriggerFileDownload).not.toHaveBeenCalled()
    })

    it('should return undefined', () => {
      expect(result).toBeUndefined()
    })
  })
})
