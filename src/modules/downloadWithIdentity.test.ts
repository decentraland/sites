/* eslint-disable @typescript-eslint/naming-convention, import/order */
import type { Architecture } from '../types/download.types'

const mockCalculateCDNReleaseLinksWithIdentity = jest.fn()
const mockExtractDownloadLinkFromCDNReleaseOption = jest.fn()
const mockAddQueryParamsToUrlString = jest.fn()
const mockTriggerFileDownload = jest.fn()
const mockEnsureSegmentAnonymousId = jest.fn()

jest.mock('./url', () => ({
  calculateCDNReleaseLinksWithIdentity: (...args: unknown[]) => mockCalculateCDNReleaseLinksWithIdentity(...args),
  extractDownloadLinkFromCDNReleaseOption: (...args: unknown[]) => mockExtractDownloadLinkFromCDNReleaseOption(...args),
  addQueryParamsToUrlString: (...args: unknown[]) => mockAddQueryParamsToUrlString(...args)
}))

jest.mock('./file', () => ({
  triggerFileDownload: (...args: unknown[]) => mockTriggerFileDownload(...args)
}))

jest.mock('./segmentAnonymousId', () => ({
  ensureSegmentAnonymousId: (...args: unknown[]) => mockEnsureSegmentAnonymousId(...args)
}))

import { calculateDownloadUrl, getDownloadLinkWithIdentity, resolveGatewayAnonUserId } from './downloadWithIdentity'

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
      expect(mockCalculateCDNReleaseLinksWithIdentity).toHaveBeenCalledWith(
        undefined,
        {
          Windows: { amd64: 'https://fallback.example.com/launcher-setup.exe' }
        },
        undefined
      )
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
      expect(mockCalculateCDNReleaseLinksWithIdentity).toHaveBeenCalledWith(undefined, null, undefined)
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

describe('resolveGatewayAnonUserId', () => {
  beforeEach(() => {
    mockEnsureSegmentAnonymousId.mockReturnValue('generated-anon')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('when an anon_user_id is already present', () => {
    it('should return it verbatim without minting a new one', () => {
      const result = resolveGatewayAnonUserId('existing-anon', { position: '10,20', realm: 'main' })

      expect(result).toBe('existing-anon')
      expect(mockEnsureSegmentAnonymousId).not.toHaveBeenCalled()
    })
  })

  describe('when there is no anon_user_id but deep-link params are present', () => {
    it('should mint one for a position param', () => {
      const result = resolveGatewayAnonUserId(undefined, { position: '10,20' })

      expect(result).toBe('generated-anon')
      expect(mockEnsureSegmentAnonymousId).toHaveBeenCalledTimes(1)
    })

    it('should mint one for a realm param', () => {
      const result = resolveGatewayAnonUserId(undefined, { realm: 'myworld.dcl.eth' })

      expect(result).toBe('generated-anon')
      expect(mockEnsureSegmentAnonymousId).toHaveBeenCalledTimes(1)
    })
  })

  describe('when there is no anon_user_id and no deep-link params', () => {
    it('should return undefined without minting one', () => {
      const result = resolveGatewayAnonUserId(undefined, {})

      expect(result).toBeUndefined()
      expect(mockEnsureSegmentAnonymousId).not.toHaveBeenCalled()
    })
  })

  describe('when there is no anon_user_id and no deep-link params but a referrer is present', () => {
    it('should mint one to force the gateway route (the referrer is baked into the installer)', () => {
      const result = resolveGatewayAnonUserId(undefined, {}, '0x24e5f44999c151f08609f8e27b2238c773c4d020')

      expect(result).toBe('generated-anon')
      expect(mockEnsureSegmentAnonymousId).toHaveBeenCalledTimes(1)
    })
  })

  describe('when there is no anon_user_id, no deep-link params and no referrer', () => {
    it('should not mint one for a null referrer', () => {
      const result = resolveGatewayAnonUserId(undefined, {}, null)

      expect(result).toBeUndefined()
      expect(mockEnsureSegmentAnonymousId).not.toHaveBeenCalled()
    })
  })
})
