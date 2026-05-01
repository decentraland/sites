/* eslint-disable @typescript-eslint/naming-convention */
jest.mock('decentraland-ui2/dist/modules/cdnReleases', () => ({
  CDNSource: { LAUNCHER: 'launcher', AUTO_SIGNING: 'auto_signing' },
  getCDNRelease: jest.fn().mockReturnValue(null)
}))

jest.mock('decentraland-ui2/dist/config', () => ({
  config: { get: jest.fn().mockReturnValue('https://download-gateway.decentraland.zone') }
}))

import { CDNSource, getCDNRelease } from 'decentraland-ui2/dist/modules/cdnReleases'
import {
  addQueryParamsToUrlString,
  calculateCDNReleaseLinksWithIdentity,
  extractDownloadLinkFromCDNReleaseOption,
  sanitizeCDNReleaseLinks,
  updateUrlWithLastValue
} from './url'

const mockGetCDNRelease = getCDNRelease as jest.Mock

describe('addQueryParamsToUrlString', () => {
  describe('when called with params', () => {
    let result: string

    beforeEach(() => {
      result = addQueryParamsToUrlString('https://example.com/download', {
        anon_user_id: 'abc-123',
        source: 'landing'
      })
    })

    it('should append the params to the URL', () => {
      expect(result).toBe('https://example.com/download?anon_user_id=abc-123&source=landing')
    })
  })

  describe('when params contain undefined or null values', () => {
    let result: string

    beforeEach(() => {
      result = addQueryParamsToUrlString('https://example.com/download', {
        anon_user_id: 'abc-123',
        empty: undefined,
        nullable: null
      })
    })

    it('should skip undefined and null values', () => {
      expect(result).toBe('https://example.com/download?anon_user_id=abc-123')
    })
  })

  describe('when the URL already has query params', () => {
    let result: string

    beforeEach(() => {
      result = addQueryParamsToUrlString('https://example.com/download?existing=true', { anon_user_id: 'abc-123' })
    })

    it('should append new params alongside the existing ones', () => {
      expect(result).toBe('https://example.com/download?existing=true&anon_user_id=abc-123')
    })
  })

  describe('when params is an empty object', () => {
    let result: string

    beforeEach(() => {
      result = addQueryParamsToUrlString('https://example.com/download', {})
    })

    it('should return the original URL unchanged', () => {
      expect(result).toBe('https://example.com/download')
    })
  })
})

describe('updateUrlWithLastValue', () => {
  describe('when the URL does not have the param yet', () => {
    let result: string

    beforeEach(() => {
      result = updateUrlWithLastValue('https://example.com/download', 'version', '2.0')
    })

    it('should append the param', () => {
      expect(result).toBe('https://example.com/download?version=2.0')
    })
  })

  describe('when the URL already has the param', () => {
    let result: string

    beforeEach(() => {
      result = updateUrlWithLastValue('https://example.com/download?version=1.0', 'version', '2.0')
    })

    it('should replace the existing value with the new one', () => {
      expect(result).toBe('https://example.com/download?version=2.0')
    })
  })

  describe('when the URL has multiple params and only one needs updating', () => {
    let result: string

    beforeEach(() => {
      result = updateUrlWithLastValue('https://example.com/download?source=landing&version=1.0', 'version', '3.0')
    })

    it('should update only the targeted param and preserve others', () => {
      const url = new URL(result)
      expect(url.searchParams.get('source')).toBe('landing')
      expect(url.searchParams.get('version')).toBe('3.0')
    })
  })
})

describe('sanitizeCDNReleaseLinks', () => {
  describe('when given null', () => {
    let result: ReturnType<typeof sanitizeCDNReleaseLinks>

    beforeEach(() => {
      result = sanitizeCDNReleaseLinks(null)
    })

    it('should return null', () => {
      expect(result).toBeNull()
    })
  })

  describe('when all links are undefined', () => {
    let result: ReturnType<typeof sanitizeCDNReleaseLinks>

    beforeEach(() => {
      result = sanitizeCDNReleaseLinks({
        Windows: { amd64: undefined },
        macOS: { arm64: undefined }
      })
    })

    it('should return null', () => {
      expect(result).toBeNull()
    })
  })

  describe('when some links are defined and some are undefined', () => {
    let result: ReturnType<typeof sanitizeCDNReleaseLinks>

    beforeEach(() => {
      result = sanitizeCDNReleaseLinks({
        Windows: {
          amd64: 'https://cdn.example.com/win64.exe',
          arm64: undefined
        },
        macOS: { arm64: undefined }
      })
    })

    it('should keep only entries with defined links', () => {
      expect(result).toEqual({
        Windows: { amd64: 'https://cdn.example.com/win64.exe' }
      })
    })

    it('should omit OS entries where all links are undefined', () => {
      expect(result).not.toHaveProperty('macOS')
    })
  })

  describe('when all links are defined', () => {
    let result: ReturnType<typeof sanitizeCDNReleaseLinks>

    beforeEach(() => {
      result = sanitizeCDNReleaseLinks({
        Windows: { amd64: 'https://cdn.example.com/win64.exe' },
        macOS: { arm64: 'https://cdn.example.com/mac-arm.dmg' }
      })
    })

    it('should return all links as-is', () => {
      expect(result).toEqual({
        Windows: { amd64: 'https://cdn.example.com/win64.exe' },
        macOS: { arm64: 'https://cdn.example.com/mac-arm.dmg' }
      })
    })
  })
})

describe('extractDownloadLinkFromCDNReleaseOption', () => {
  describe('when cdnReleaseLinks has a matching OS and arch', () => {
    let result: string | undefined

    beforeEach(() => {
      result = extractDownloadLinkFromCDNReleaseOption('Windows', 'amd64', undefined, {
        Windows: { amd64: 'https://cdn.example.com/win64.exe' }
      })
    })

    it('should return the matching link', () => {
      expect(result).toBe('https://cdn.example.com/win64.exe')
    })
  })

  describe('when cdnReleaseLinks has the OS but not the arch', () => {
    let result: string | undefined

    beforeEach(() => {
      result = extractDownloadLinkFromCDNReleaseOption('Windows', 'arm64', undefined, {
        Windows: { amd64: 'https://cdn.example.com/win64.exe' }
      })
    })

    it('should return the first available link for the OS', () => {
      expect(result).toBe('https://cdn.example.com/win64.exe')
    })
  })

  describe('when cdnReleaseLinks does not have the OS', () => {
    let result: string | undefined

    beforeEach(() => {
      result = extractDownloadLinkFromCDNReleaseOption('Linux', 'amd64', 'https://fallback.example.com/linux.tar.gz', {
        Windows: { amd64: 'https://cdn.example.com/win64.exe' }
      })
    })

    it('should return the fallback link', () => {
      expect(result).toBe('https://fallback.example.com/linux.tar.gz')
    })
  })

  describe('when cdnReleaseLinks is null', () => {
    let result: string | undefined

    beforeEach(() => {
      result = extractDownloadLinkFromCDNReleaseOption('Windows', 'amd64', 'https://fallback.example.com/win.exe', null)
    })

    it('should return the fallback link', () => {
      expect(result).toBe('https://fallback.example.com/win.exe')
    })
  })

  describe('when arch is undefined and cdnReleaseLinks has the OS', () => {
    let result: string | undefined

    beforeEach(() => {
      result = extractDownloadLinkFromCDNReleaseOption('macOS', undefined, undefined, {
        macOS: { arm64: 'https://cdn.example.com/mac-arm.dmg' }
      })
    })

    it('should return the first available link for the OS', () => {
      expect(result).toBe('https://cdn.example.com/mac-arm.dmg')
    })
  })
})

describe('calculateCDNReleaseLinksWithIdentity', () => {
  afterEach(() => {
    mockGetCDNRelease.mockReset()
  })

  describe('when getIdentityId is not provided', () => {
    describe('and fallbackLinks are provided', () => {
      let result: Record<string, Record<string, string>> | null

      beforeEach(async () => {
        mockGetCDNRelease.mockReturnValue(null)
        result = await calculateCDNReleaseLinksWithIdentity(undefined, {
          Windows: { amd64: 'https://fallback.example.com/win.exe' }
        })
      })

      it('should return the fallback links', () => {
        expect(result).toEqual({
          Windows: { amd64: 'https://fallback.example.com/win.exe' }
        })
      })

      it('should call getCDNRelease with LAUNCHER source', () => {
        expect(mockGetCDNRelease).toHaveBeenCalledWith(CDNSource.LAUNCHER)
      })
    })

    describe('and fallbackLinks are not provided', () => {
      let result: Record<string, Record<string, string>> | null

      beforeEach(async () => {
        mockGetCDNRelease.mockReturnValue({
          Windows: { amd64: 'https://cdn.example.com/win.exe' }
        })
        result = await calculateCDNReleaseLinksWithIdentity(undefined, null)
      })

      it('should return sanitized CDN launcher links', () => {
        expect(result).toEqual({
          Windows: { amd64: 'https://cdn.example.com/win.exe' }
        })
      })
    })
  })

  describe('when getIdentityId returns an identity', () => {
    let result: Record<string, Record<string, string>> | null

    beforeEach(async () => {
      mockGetCDNRelease.mockReturnValue({
        Windows: { amd64: 'https://cdn.example.com/identity-win.exe' }
      })
      result = await calculateCDNReleaseLinksWithIdentity(async () => 'test-identity-id')
    })

    it('should call getCDNRelease with AUTO_SIGNING and the identity', () => {
      expect(mockGetCDNRelease).toHaveBeenCalledWith(CDNSource.AUTO_SIGNING, 'test-identity-id')
    })

    it('should return the CDN links', () => {
      expect(result).toEqual({
        Windows: { amd64: 'https://cdn.example.com/identity-win.exe' }
      })
    })
  })

  describe('when getIdentityId returns undefined', () => {
    beforeEach(async () => {
      mockGetCDNRelease.mockReturnValue(null)
      await calculateCDNReleaseLinksWithIdentity(async () => undefined)
    })

    it('should fall back to LAUNCHER source', () => {
      expect(mockGetCDNRelease).toHaveBeenCalledWith(CDNSource.LAUNCHER)
    })
  })

  describe('when getIdentityId throws an error', () => {
    let result: Record<string, Record<string, string>> | null
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(async () => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockGetCDNRelease.mockReturnValue(null)
      result = await calculateCDNReleaseLinksWithIdentity(
        async () => {
          throw new Error('identity failed')
        },
        { Windows: { amd64: 'https://fallback.example.com/win.exe' } }
      )
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
    })

    it('should log the error', () => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to generate identityId:', expect.any(Error))
    })

    it('should return fallback links', () => {
      expect(result).toEqual({
        Windows: { amd64: 'https://fallback.example.com/win.exe' }
      })
    })
  })

  describe('when there is no identity but an anon_user_id is provided', () => {
    const ANON_ID = '391a85da-a3bb-49e2-a45e-96c740c38424'
    let result: Record<string, Record<string, string>> | null

    describe('and getIdentityId is not passed', () => {
      beforeEach(async () => {
        result = await calculateCDNReleaseLinksWithIdentity(undefined, null, ANON_ID)
      })

      it('should return the gateway anonymous URL embedding the anon_user_id', () => {
        expect(result).toEqual({
          Windows: {
            amd64: `https://download-gateway.decentraland.zone/anonymous/decentraland.exe?anon_user_id=${ANON_ID}`
          },
          macOS: {
            arm64: `https://download-gateway.decentraland.zone/anonymous/decentraland.dmg?anon_user_id=${ANON_ID}`,
            amd64: `https://download-gateway.decentraland.zone/anonymous/decentraland.dmg?anon_user_id=${ANON_ID}`
          }
        })
      })
    })

    describe('and getIdentityId returns undefined', () => {
      beforeEach(async () => {
        result = await calculateCDNReleaseLinksWithIdentity(async () => undefined, null, ANON_ID)
      })

      it('should still route through the gateway anonymous URL', () => {
        expect(result?.Windows.amd64).toBe(`https://download-gateway.decentraland.zone/anonymous/decentraland.exe?anon_user_id=${ANON_ID}`)
      })
    })

    describe('and getIdentityId returns an identity', () => {
      beforeEach(async () => {
        mockGetCDNRelease.mockReturnValue({
          Windows: { amd64: 'https://cdn.example.com/identity-win.exe' }
        })
        result = await calculateCDNReleaseLinksWithIdentity(async () => 'test-id', null, ANON_ID)
      })

      it('should prefer AUTO_SIGNING over the anonymous route', () => {
        expect(mockGetCDNRelease).toHaveBeenCalledWith(CDNSource.AUTO_SIGNING, 'test-id')
        expect(result).toEqual({
          Windows: { amd64: 'https://cdn.example.com/identity-win.exe' }
        })
      })
    })
  })
})
