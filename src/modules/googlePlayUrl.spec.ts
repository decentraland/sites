/**
 * @jest-environment node
 */
import { buildGooglePlayUrl } from './googlePlayUrl'

const BASE = 'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer'

const decodedReferrer = (url: string) => new URLSearchParams(new URL(url).searchParams.get('referrer') ?? '')

describe('when building a Play Store URL outside a browser', () => {
  describe('and utm params are given', () => {
    let result: string

    beforeEach(() => {
      result = buildGooglePlayUrl(BASE, { utm_source: 'llmstxt', utm_medium: 'referral' })
    })

    it('should append the utm params and the referrer mirror, encoded once', () => {
      expect(result).toBe(
        'https://play.google.com/store/apps/details?id=org.decentraland.godotexplorer&utm_source=llmstxt&utm_medium=referral&referrer=utm_source%3Dllmstxt%26utm_medium%3Dreferral'
      )
    })

    it('should round-trip the referrer back to the exact utm set', () => {
      expect(Object.fromEntries(decodedReferrer(result))).toEqual({ utm_source: 'llmstxt', utm_medium: 'referral' })
    })

    it('should keep the package id out of the referrer', () => {
      expect(decodedReferrer(result).get('id')).toBeNull()
    })
  })

  describe('and a utm param is already on the base URL', () => {
    it('should override it in place and mirror the final value', () => {
      const result = buildGooglePlayUrl(`${BASE}&utm_source=fdn&utm_medium=qr`, { utm_source: 'x' })
      const url = new URL(result)
      expect([...url.searchParams.keys()]).toEqual(['id', 'utm_source', 'utm_medium', 'referrer'])
      expect(url.searchParams.get('utm_source')).toBe('x')
      expect(decodedReferrer(result).toString()).toBe('utm_source=x&utm_medium=qr')
    })
  })

  describe('and no utm params are given', () => {
    it('should still set an empty referrer', () => {
      expect(buildGooglePlayUrl(BASE, {})).toBe(`${BASE}&referrer=`)
    })
  })
})
