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
  buildDownloadSuccessHref,
  buildTrackedDownloadUrl,
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

describe('buildTrackedDownloadUrl', () => {
  describe('when the base is an absolute url', () => {
    it('should append the params without altering the origin', () => {
      const result = buildTrackedDownloadUrl('https://decentraland.org/download', { position: '42,-5', anon_user_id: 'abc' })
      const url = new URL(result)
      expect(url.origin + url.pathname).toBe('https://decentraland.org/download')
      expect(url.searchParams.get('position')).toBe('42,-5')
      expect(url.searchParams.get('anon_user_id')).toBe('abc')
    })
  })

  describe('when the base is a relative url (dev/zone env)', () => {
    it('should resolve it against the current origin instead of throwing', () => {
      const result = buildTrackedDownloadUrl('/download', { position: '42,-5' })
      const url = new URL(result)
      expect(url.origin).toBe(window.location.origin)
      expect(url.pathname).toBe('/download')
      expect(url.searchParams.get('position')).toBe('42,-5')
    })
  })

  describe('when params contain undefined values', () => {
    it('should drop them', () => {
      const result = buildTrackedDownloadUrl('https://decentraland.org/download', { position: '42,-5', anon_user_id: undefined })
      expect(result).toContain('position=42%2C-5')
      expect(result).not.toContain('anon_user_id')
    })
  })

  describe('when the base cannot be parsed as a url', () => {
    it('should return the raw base untouched', () => {
      expect(buildTrackedDownloadUrl('http://[', { position: '42,-5' })).toBe('http://[')
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

describe('buildDownloadSuccessHref', () => {
  describe('when called with os and place', () => {
    let result: string
    let url: URL

    beforeEach(() => {
      result = buildDownloadSuccessHref('Windows', 'landing-hero')
      url = new URL(result, 'https://decentraland.org')
    })

    it('should include the os and place query params', () => {
      expect([url.searchParams.get('os'), url.searchParams.get('place')]).toEqual(['Windows', 'landing-hero'])
    })
  })

  describe('when anonUserId is provided', () => {
    let result: string
    let url: URL

    beforeEach(() => {
      result = buildDownloadSuccessHref('Windows', 'landing-hero', { anonUserId: 'anon-123' })
      url = new URL(result, 'https://decentraland.org')
    })

    it('should include anon_user_id', () => {
      expect(url.searchParams.get('anon_user_id')).toBe('anon-123')
    })
  })

  describe('when anonUserId is missing', () => {
    let result: string
    let url: URL

    beforeEach(() => {
      result = buildDownloadSuccessHref('Windows', 'landing-hero')
      url = new URL(result, 'https://decentraland.org')
    })

    it('should omit anon_user_id', () => {
      expect(url.searchParams.has('anon_user_id')).toBe(false)
    })
  })

  describe('when arch is provided', () => {
    let result: string
    let url: URL

    beforeEach(() => {
      result = buildDownloadSuccessHref('macOS', 'download-page', { arch: 'arm64' })
      url = new URL(result, 'https://decentraland.org')
    })

    it('should include arch', () => {
      expect(url.searchParams.get('arch')).toBe('arm64')
    })
  })

  describe('when query values contain special characters', () => {
    let result: string

    beforeEach(() => {
      result = buildDownloadSuccessHref('Windows 11', 'landing hero/cta', { anonUserId: 'anon+id@example.com', arch: 'arm64 beta' })
    })

    it('should encode them with URLSearchParams', () => {
      expect(result).toBe('/download_success?os=Windows+11&place=landing+hero%2Fcta&anon_user_id=anon%2Bid%40example.com&arch=arm64+beta')
    })
  })

  describe('when campaign params are provided', () => {
    let url: URL

    beforeEach(() => {
      const result = buildDownloadSuccessHref('Windows', 'download-page', {
        arch: 'x64',
        campaignParams: { utm_org: 'dcl', utm_source: 'shefi', utm_campaign: 'partner-launch' }
      })
      url = new URL(result, 'https://decentraland.org')
    })

    it('should append each campaign param alongside os, place and arch', () => {
      expect(url.searchParams.get('os')).toBe('Windows')
      expect(url.searchParams.get('place')).toBe('download-page')
      expect(url.searchParams.get('arch')).toBe('x64')
      expect(url.searchParams.get('utm_org')).toBe('dcl')
      expect(url.searchParams.get('utm_source')).toBe('shefi')
      expect(url.searchParams.get('utm_campaign')).toBe('partner-launch')
    })
  })

  describe('when a campaign param key collides with a routing param', () => {
    it('should never overwrite the already-set os/place/arch/anon_user_id params', () => {
      // Unreachable via collectCampaignParams (utm_* allowlist), but the
      // option is a bare Record — a future caller passing raw searchParams
      // entries must not be able to corrupt the funnel routing.
      const result = buildDownloadSuccessHref('Windows', 'download-page', {
        anonUserId: 'anon-123',
        arch: 'x64',
        campaignParams: { os: 'evil', place: 'evil-place', arch: 'evil-arch', anon_user_id: 'evil-id', utm_source: 'shefi' }
      })
      const url = new URL(result, 'https://decentraland.org')

      expect(url.searchParams.get('os')).toBe('Windows')
      expect(url.searchParams.get('place')).toBe('download-page')
      expect(url.searchParams.get('arch')).toBe('x64')
      expect(url.searchParams.get('anon_user_id')).toBe('anon-123')
      expect(url.searchParams.get('utm_source')).toBe('shefi')
    })
  })

  describe('when deep-link params are provided', () => {
    let url: URL

    beforeEach(() => {
      const result = buildDownloadSuccessHref('macOS', 'download-page', {
        arch: 'arm64',
        deepLinkParams: { position: '10,20', realm: 'foo.eth' },
        campaignParams: { utm_source: 'shefi' }
      })
      url = new URL(result, 'https://decentraland.org')
    })

    it('should append position and realm alongside the routing and campaign params', () => {
      expect(url.searchParams.get('position')).toBe('10,20')
      expect(url.searchParams.get('realm')).toBe('foo.eth')
      expect(url.searchParams.get('utm_source')).toBe('shefi')
      expect(url.searchParams.get('os')).toBe('macOS')
    })
  })

  describe('when a referrer is provided', () => {
    it('should append it alongside the routing params', () => {
      const result = buildDownloadSuccessHref('Windows', 'download-page', {
        arch: 'x64',
        referrer: '0x24e5f44999c151f08609f8e27b2238c773c4d020'
      })
      const url = new URL(result, 'https://decentraland.org')
      expect(url.searchParams.get('referrer')).toBe('0x24e5f44999c151f08609f8e27b2238c773c4d020')
      expect(url.searchParams.get('os')).toBe('Windows')
    })

    it('should not append a referrer param when none is provided', () => {
      const result = buildDownloadSuccessHref('Windows', 'download-page')
      expect(result).not.toContain('referrer')
    })
  })

  describe('when a deep-link param key collides with a routing param', () => {
    it('should never overwrite the already-set os/place/arch/anon_user_id params', () => {
      const result = buildDownloadSuccessHref('Windows', 'download-page', {
        anonUserId: 'anon-123',
        deepLinkParams: { os: 'evil', anon_user_id: 'evil-id', position: '1,2' }
      })
      const url = new URL(result, 'https://decentraland.org')

      expect(url.searchParams.get('os')).toBe('Windows')
      expect(url.searchParams.get('anon_user_id')).toBe('anon-123')
      expect(url.searchParams.get('position')).toBe('1,2')
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

      it('should return the bare gateway anonymous URL (no anon_user_id query param)', () => {
        // The query param is appended by callsites via addQueryParamsToUrlString /
        // queryParams the same way it's appended to AUTO_SIGNING URLs. Embedding
        // it here would yield ?anon_user_id=X&anon_user_id=X downstream.
        expect(result).toEqual({
          Windows: { amd64: 'https://download-gateway.decentraland.zone/anonymous/decentraland.exe' },
          macOS: {
            arm64: 'https://download-gateway.decentraland.zone/anonymous/decentraland.dmg',
            amd64: 'https://download-gateway.decentraland.zone/anonymous/decentraland.dmg'
          }
        })
      })

      it('should not embed anon_user_id in the URL (deduplication contract)', () => {
        for (const osLinks of Object.values(result || {})) {
          for (const url of Object.values(osLinks)) {
            expect(url).not.toContain('anon_user_id=')
          }
        }
      })
    })

    describe('and getIdentityId returns undefined', () => {
      beforeEach(async () => {
        result = await calculateCDNReleaseLinksWithIdentity(async () => undefined, null, ANON_ID)
      })

      it('should still route through the gateway anonymous URL', () => {
        expect(result?.Windows.amd64).toBe('https://download-gateway.decentraland.zone/anonymous/decentraland.exe')
      })
    })

    describe('and getIdentityId throws', () => {
      let consoleErrorSpy: jest.SpyInstance

      beforeEach(async () => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        result = await calculateCDNReleaseLinksWithIdentity(
          async () => {
            throw new Error('identity API down')
          },
          null,
          ANON_ID
        )
      })

      afterEach(() => {
        consoleErrorSpy.mockRestore()
      })

      it('should still return the gateway anonymous URL instead of falling back to the static CDN', () => {
        // When identity creation fails but we DO have an anon_user_id, we still
        // want the wrapper installer with attribution — falling back to direct
        // CDN here would silently drop the campaign id even though we had it.
        expect(result?.Windows.amd64).toBe('https://download-gateway.decentraland.zone/anonymous/decentraland.exe')
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to generate identityId:', expect.any(Error))
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
